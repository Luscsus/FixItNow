package com.example.backend.service;

import com.example.backend.domain.ticket.Ticket;
import com.example.backend.domain.ticket.TicketPriority;
import com.example.backend.domain.ticket.TicketStatus;
import com.example.backend.domain.ticket.TicketStatusHistory;
import com.example.backend.dto.CreateTicketRequest;
import com.example.backend.dto.OpenTicketSummary;
import com.example.backend.dto.TicketResponse;
import com.example.backend.exception.InvalidTicketStatusTransitionException;
import com.example.backend.exception.TicketNotFoundException;
import com.example.backend.exception.UserNotFoundException;
import com.example.backend.repository.ProviderRepository;
import com.example.backend.repository.TicketRepository;
import com.example.backend.repository.TicketStatusHistoryRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.LocationRepository;
import com.example.backend.domain.user.Provider;
import com.example.backend.domain.user.User;
import com.example.backend.domain.location.Location;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class TicketService {

    private static final double EARTH_RADIUS_KM = 6371.0;

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final ProviderRepository providerRepository;
    private final CalendarService calendarService;
    private final TicketStatusHistoryRepository statusHistoryRepository;

    public TicketService(TicketRepository ticketRepository, UserRepository userRepository,
                         LocationRepository locationRepository, ProviderRepository providerRepository,
                         CalendarService calendarService, TicketStatusHistoryRepository statusHistoryRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.locationRepository = locationRepository;
        this.providerRepository = providerRepository;
        this.calendarService = calendarService;
        this.statusHistoryRepository = statusHistoryRepository;
    }

    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request, UUID userId) throws UserNotFoundException {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        Ticket ticket = new Ticket();
        ticket.setUser(user);
        ticket.setServiceType(request.getServiceType());
        ticket.setCategory(request.getCategory());
        ticket.setDescription(request.getDescription());
        Location location = upsertLocation(user, request);
        ticket.setLocation(location);
        ticket.setPriority(request.getPriority() != null ? request.getPriority() : TicketPriority.MEDIUM);
        ticket.setStatus(TicketStatus.PENDING_APPROVAL);

        if (request.getAssignedProviderId() != null) {
            Provider provider = providerRepository.findById(request.getAssignedProviderId())
                .orElseThrow(() -> new UserNotFoundException("Provider not found: " + request.getAssignedProviderId()));
            ticket.setAssignedServiceProvider(provider);
        }

        if (request.getRequestedStartAt() != null && request.getRequestedEndAt() != null) {
            ticket.setRequestedStartAt(request.getRequestedStartAt());
            ticket.setRequestedEndAt(request.getRequestedEndAt());
        }

        Ticket saved = ticketRepository.save(ticket);
        recordHistory(saved, TicketStatus.PENDING_APPROVAL);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getUserTickets(UUID userId) throws UserNotFoundException {
        if (!userRepository.existsById(userId)) {
            throw new UserNotFoundException("User not found: " + userId);
        }
        return ticketRepository.findByUser_IdOrderByCreatedAtDesc(userId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public TicketResponse updateTicketStatus(Long ticketId, TicketStatus newStatus) throws TicketNotFoundException {
        Ticket ticket = getTicketOrThrow(ticketId);
        TicketStatus currentStatus = ticket.getStatus();

        if (currentStatus != newStatus && !isValidStatusTransition(currentStatus, newStatus)) {
            throw new InvalidTicketStatusTransitionException(
                "Invalid ticket status transition from " + currentStatus + " to " + newStatus
            );
        }

        ticket.setStatus(newStatus);
        Ticket saved = ticketRepository.save(ticket);
        recordHistory(saved, newStatus);
        calendarService.syncBookedBlockForTicket(saved);
        return toResponse(saved);
    }

    @Transactional
    public TicketResponse scheduleTicket(Long ticketId, UUID providerId, LocalDateTime startAt, LocalDateTime endAt) {
        Ticket ticket = getTicketOrThrow(ticketId);
        if (ticket.getAssignedServiceProvider() == null
            || !ticket.getAssignedServiceProvider().getId().equals(providerId)) {
            throw new AccessDeniedException("Only the assigned provider can schedule this ticket.");
        }
        ticket.setScheduledStartAt(startAt);
        ticket.setScheduledEndAt(endAt);
        Ticket saved = ticketRepository.save(ticket);
        calendarService.syncBookedBlockForTicket(saved);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public TicketResponse getTicketDetails(Long ticketId) throws TicketNotFoundException {
        Ticket ticket = getTicketOrThrow(ticketId);
        TicketResponse resp = toResponse(ticket);
        resp.setStatusHistory(
            statusHistoryRepository.findByTicket_IdOrderByChangedAtAsc(ticketId).stream()
                .map(h -> new TicketResponse.StatusHistoryEntry(h.getStatus(), h.getChangedAt()))
                .toList()
        );
        return resp;
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getProviderTickets(UUID providerId) {
        return ticketRepository.findByAssignedServiceProvider_IdOrderByCreatedAtDesc(providerId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getOpenTickets() {
        return ticketRepository
            .findByAssignedServiceProviderIsNullAndStatusOrderByCreatedAtDesc(TicketStatus.PENDING_APPROVAL)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<OpenTicketSummary> getPublicOpenTicketSummaries() {
        return ticketRepository.findTop20OpenTicketSummaries();
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getOpenTicketsFull() {
        return ticketRepository
                .findByAssignedServiceProviderIsNullAndStatusOrderByCreatedAtDesc(TicketStatus.PENDING_APPROVAL)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public TicketResponse confirmTicket(Long ticketId, UUID providerId) {
        Ticket ticket = getTicketOrThrow(ticketId);
        if (ticket.getAssignedServiceProvider() == null
                || !ticket.getAssignedServiceProvider().getId().equals(providerId)) {
            throw new AccessDeniedException("Only the assigned provider can confirm this ticket.");
        }
        if (ticket.getStatus() != TicketStatus.PENDING_APPROVAL) {
            throw new InvalidTicketStatusTransitionException(
                "Ticket " + ticketId + " is not awaiting confirmation (status: " + ticket.getStatus() + ")");
        }
        ticket.setStatus(TicketStatus.APPROVED);
        if (ticket.getRequestedStartAt() != null && ticket.getRequestedEndAt() != null) {
            ticket.setScheduledStartAt(ticket.getRequestedStartAt());
            ticket.setScheduledEndAt(ticket.getRequestedEndAt());
        }
        Ticket saved = ticketRepository.save(ticket);
        recordHistory(saved, TicketStatus.APPROVED);
        calendarService.syncBookedBlockForTicket(saved);
        return toResponse(saved);
    }

    @Transactional
    public TicketResponse acceptOpenTicket(Long ticketId, UUID providerId) {
        Ticket ticket = getTicketOrThrow(ticketId);
        if (ticket.getStatus() != TicketStatus.PENDING_APPROVAL) {
            throw new InvalidTicketStatusTransitionException(
                "Ticket " + ticketId + " is not available for acceptance (status: " + ticket.getStatus() + ")"
            );
        }
        if (ticket.getAssignedServiceProvider() != null) {
            throw new InvalidTicketStatusTransitionException(
                "Ticket " + ticketId + " is already assigned to a provider"
            );
        }
        Provider provider = providerRepository.findById(providerId)
            .orElseThrow(() -> new UserNotFoundException("Provider not found: " + providerId));
        ticket.setAssignedServiceProvider(provider);
        ticket.setStatus(TicketStatus.APPROVED);
        Ticket saved = ticketRepository.save(ticket);
        recordHistory(saved, TicketStatus.APPROVED);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> findNearbyTickets(Double latitude, Double longitude, Double radiusKm) {
        double effectiveRadius = radiusKm == null ? 5.0 : radiusKm;
        if (latitude == null || longitude == null || effectiveRadius < 0) {
            return List.of();
        }

        return ticketRepository.findAllWithCoordinates()
            .stream()
            .filter(ticket -> ticket.getLocation() != null)
            .map(ticket -> new NearbyTicket(ticket, haversine(latitude, longitude,
                ticket.getLocation().getLatitude(), ticket.getLocation().getLongitude())))
            .filter(candidate -> candidate.distanceKm <= effectiveRadius)
            .sorted(Comparator.comparingDouble(candidate -> candidate.distanceKm))
            .map(candidate -> toResponse(candidate.ticket))
            .toList();
    }

    private void recordHistory(Ticket ticket, TicketStatus status) {
        statusHistoryRepository.save(
            TicketStatusHistory.builder()
                .ticket(ticket)
                .status(status)
                .build()
        );
    }

    private Ticket getTicketOrThrow(Long ticketId) {
        return ticketRepository.findById(ticketId)
            .orElseThrow(() -> new TicketNotFoundException("Ticket not found: " + ticketId));
    }

    private boolean isValidStatusTransition(TicketStatus current, TicketStatus next) {
        if (current == null || next == null) {
            return false;
        }
        return switch (current) {
            case PENDING_APPROVAL -> next == TicketStatus.APPROVED
                || next == TicketStatus.DECLINED
                || next == TicketStatus.CANCELLED;
            case APPROVED -> next == TicketStatus.IN_TRANSIT
                || next == TicketStatus.CANCELLED;
            case IN_TRANSIT -> next == TicketStatus.PENDING_PROVIDER_INVOICE
                || next == TicketStatus.CANCELLED;
            case PENDING_PROVIDER_INVOICE -> next == TicketStatus.PENDING_PAYMENT
                || next == TicketStatus.CANCELLED;
            case PENDING_PAYMENT -> next == TicketStatus.COMPLETED
                || next == TicketStatus.CANCELLED;
            case DECLINED, COMPLETED, CANCELLED -> next == current;
        };
    }

    private TicketResponse toResponse(Ticket ticket) {
        String providerName = ticket.getAssignedServiceProvider() != null
            ? formatProviderName(ticket.getAssignedServiceProvider())
            : null;
        String submittedByName = ticket.getUser() != null
            ? formatProviderName(ticket.getUser())
            : null;
        TicketResponse resp = new TicketResponse(
            ticket.getId(),
            ticket.getServiceType(),
            ticket.getCategory(),
            ticket.getDescription(),
            ticket.getLocation() != null ? ticket.getLocation().getFormattedAddress() : null,
            ticket.getStatus(),
            ticket.getPriority(),
            ticket.getEstimatedCost(),
            ticket.getCreatedAt(),
            providerName,
            submittedByName
        );
        resp.setRequestedStartAt(ticket.getRequestedStartAt());
        resp.setRequestedEndAt(ticket.getRequestedEndAt());
        return resp;
    }

    private Location upsertLocation(User user, CreateTicketRequest request) {
        if (request.getLocation() == null || request.getLocation().isBlank()) {
            return user.getLocation();
        }

        Location location = user.getLocation();
        if (location == null) {
            location = new Location();
        }
        location.setStreetName(request.getLocation());
        location.setLatitude(request.getLatitude());
        location.setLongitude(request.getLongitude());
        location = locationRepository.save(location);

        user.setLocation(location);
        userRepository.save(user);
        return location;
    }

    private String formatProviderName(User provider) {
        String fullName = ((provider.getFirstName() != null ? provider.getFirstName() : "") + " "
            + (provider.getLastName() != null ? provider.getLastName() : "")).trim();
        return fullName.isBlank() ? provider.getEmail() : fullName;
    }

    private double haversine(Double lat1, Double lon1, Double lat2, Double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }

    private static class NearbyTicket {
        private final Ticket ticket;
        private final double distanceKm;

        private NearbyTicket(Ticket ticket, double distanceKm) {
            this.ticket = ticket;
            this.distanceKm = distanceKm;
        }
    }
}
