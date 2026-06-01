package com.example.backend.service;

import com.example.backend.common.GeoUtils;
import com.example.backend.common.exception.ApiException;
import com.example.backend.common.exception.ResourceNotFoundException;
import com.example.backend.domain.location.Location;
import com.example.backend.domain.ticket.Ticket;
import com.example.backend.domain.ticket.TicketStatus;
import com.example.backend.dto.ProviderLocationUpdate;
import com.example.backend.dto.TrackingUpdateResponse;
import com.example.backend.repository.LocationRepository;
import com.example.backend.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Live GPS tracking of a provider en route to a ticket.
 * <p>
 * On each provider location update we persist the latest position, compute the
 * remaining driving distance/ETA (OSRM, with a straight-line fallback), and —
 * once the provider is physically within {@link #NEARBY_THRESHOLD_METERS} —
 * fire a one-shot "provider is nearby" notification to the customer.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TrackingService {

    /** Physical (straight-line) distance at which we alert the customer. */
    private static final double NEARBY_THRESHOLD_METERS = 100.0;

    private final TicketRepository ticketRepository;
    private final RoutingService routingService;
    private final NotificationService notificationService;
    private final GeocodingService geocodingService;
    private final LocationRepository locationRepository;

    /**
     * Record a provider's new position for a ticket and produce the snapshot to
     * broadcast to the customer. Validates that the caller is the assigned
     * provider and the ticket is actively in transit.
     */
    @Transactional
    public TrackingUpdateResponse handleProviderUpdate(UUID providerId, ProviderLocationUpdate update) {
        Ticket ticket = ticketRepository.findById(update.getTicketId())
            .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + update.getTicketId()));

        // Only the assigned provider may publish location for this ticket.
        if (ticket.getAssignedServiceProvider() == null
                || !ticket.getAssignedServiceProvider().getId().equals(providerId)) {
            throw new AccessDeniedException("You are not the provider assigned to this ticket.");
        }
        // Tracking is only meaningful while the provider is on the way.
        if (ticket.getStatus() != TicketStatus.IN_TRANSIT) {
            throw new ApiException("Location sharing is only active while the job is in transit.");
        }

        // Customer-side ticket addresses are stored without coordinates, so
        // geocode the destination on demand (persisted, so it's a one-time cost).
        ensureDestinationCoords(ticket);

        ticket.setProviderLat(update.getLat());
        ticket.setProviderLng(update.getLng());
        ticket.setProviderLocationUpdatedAt(LocalDateTime.now());

        TrackingUpdateResponse snapshot = buildSnapshot(ticket, update.getHeading());

        // Proximity check uses straight-line distance (physical closeness), not
        // road distance — fire once per trip.
        Location dest = ticket.getLocation();
        if (dest != null && dest.getLatitude() != null && dest.getLongitude() != null) {
            double straightLine = GeoUtils.haversineMeters(
                update.getLat(), update.getLng(), dest.getLatitude(), dest.getLongitude());
            if (straightLine <= NEARBY_THRESHOLD_METERS && !ticket.isProviderNearbyNotified()) {
                ticket.setProviderNearbyNotified(true);
                fireNearbyNotification(ticket);
            }
        }

        ticketRepository.save(ticket);
        return snapshot;
    }

    /**
     * Last-known tracking snapshot, for a customer/provider who opens or
     * refreshes the ticket page. Either party on the ticket may read it.
     */
    // Writable (not readOnly): may lazily geocode + persist the destination.
    @Transactional
    public TrackingUpdateResponse getSnapshot(UUID requesterId, Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + ticketId));

        boolean isCustomer = ticket.getUser() != null && ticket.getUser().getId().equals(requesterId);
        boolean isProvider = ticket.getAssignedServiceProvider() != null
            && ticket.getAssignedServiceProvider().getId().equals(requesterId);
        if (!isCustomer && !isProvider) {
            throw new AccessDeniedException("You cannot view tracking for this ticket.");
        }
        ensureDestinationCoords(ticket);
        return buildSnapshot(ticket, null);
    }

    // ─── helpers ───────────────────────────────────────────────────────────────

    private TrackingUpdateResponse buildSnapshot(Ticket ticket, Double heading) {
        Location dest = ticket.getLocation();
        Double destLat = dest != null ? dest.getLatitude() : null;
        Double destLng = dest != null ? dest.getLongitude() : null;

        Double distanceMeters = null;
        Double etaSeconds = null;
        if (ticket.getProviderLat() != null && ticket.getProviderLng() != null
                && destLat != null && destLng != null) {
            Optional<RoutingService.RouteResult> route = routingService.route(
                ticket.getProviderLat(), ticket.getProviderLng(), destLat, destLng);
            if (route.isPresent()) {
                distanceMeters = route.get().distanceMeters();
                etaSeconds = route.get().durationSeconds();
            } else {
                // Fallback: straight-line distance + a rough 30 km/h city speed.
                double straight = GeoUtils.haversineMeters(
                    ticket.getProviderLat(), ticket.getProviderLng(), destLat, destLng);
                distanceMeters = straight;
                etaSeconds = straight / (30_000.0 / 3600.0); // metres ÷ (m/s)
            }
        }

        boolean nearby = ticket.isProviderNearbyNotified();
        String destAddress = dest != null ? dest.getFormattedAddress() : null;

        return new TrackingUpdateResponse(
            ticket.getId(),
            ticket.getProviderLat(),
            ticket.getProviderLng(),
            heading,
            destLat,
            destLng,
            destAddress,
            distanceMeters,
            etaSeconds,
            nearby,
            ticket.getProviderLocationUpdatedAt()
        );
    }

    /**
     * Ensure the ticket's destination has coordinates. Customer ticket forms
     * capture only a free-text address, so we geocode it the first time tracking
     * needs it and persist the result onto the Location.
     */
    private void ensureDestinationCoords(Ticket ticket) {
        Location dest = ticket.getLocation();
        if (dest == null) return;
        if (dest.getLatitude() != null && dest.getLongitude() != null) return; // already have coords

        // Use free-form search (q=) rather than the structured street/city
        // geocode: customer ticket addresses are often POIs or landmarks
        // ("Europark Maribor") or street-only strings with no city, which the
        // strict structured query rejects. Free-form search resolves them.
        String query = dest.getFormattedAddress();
        var matches = (query == null || query.isBlank())
            ? java.util.List.<GeocodingService.AddressSuggestion>of()
            : geocodingService.search(query, 1);

        if (!matches.isEmpty()) {
            var m = matches.get(0);
            dest.setLatitude(m.lat());
            dest.setLongitude(m.lng());
            locationRepository.save(dest);
            log.info("Geocoded destination for ticket {} ('{}') -> [{}, {}]",
                ticket.getId(), query, m.lat(), m.lng());
        } else {
            log.warn("Could not geocode destination address for ticket {}: '{}'",
                ticket.getId(), query);
        }
    }

    private void fireNearbyNotification(Ticket ticket) {
        if (ticket.getUser() == null) return;
        String code = "FIX-" + String.format("%04d", ticket.getId());
        String providerName = ticket.getAssignedServiceProvider() != null
            ? (ticket.getAssignedServiceProvider().getFirstName() + " "
               + ticket.getAssignedServiceProvider().getLastName()).trim()
            : "Your provider";
        notificationService.notifyProviderNearby(
            ticket.getId(),
            ticket.getUser().getId(),
            "Your provider is almost there",
            providerName + " is less than 100 m away for " + code + "."
        );
        log.info("Provider-nearby notification fired for ticket {}", ticket.getId());
    }
}
