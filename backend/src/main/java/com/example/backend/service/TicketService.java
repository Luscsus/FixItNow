package com.example.backend.service;

import com.example.backend.domain.ticket.Ticket;
import com.example.backend.domain.ticket.TicketPriority;
import com.example.backend.domain.ticket.TicketStatus;
import com.example.backend.dto.CreateTicketRequest;
import com.example.backend.dto.TicketResponse;
import com.example.backend.exception.InvalidTicketStatusTransitionException;
import com.example.backend.exception.TicketNotFoundException;
import com.example.backend.exception.UserNotFoundException;
import com.example.backend.repository.TicketRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.domain.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class TicketService {

    private static final double EARTH_RADIUS_KM = 6371.0;

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    public TicketService(TicketRepository ticketRepository, UserRepository userRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request, UUID userId) throws UserNotFoundException {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        Ticket ticket = new Ticket();
        ticket.setUser(user);
        ticket.setServiceType(request.getServiceType());
        ticket.setDescription(request.getDescription());
        updateUserLocation(user, request);
        ticket.setPriority(request.getPriority() != null ? request.getPriority() : TicketPriority.MEDIUM);
        ticket.setStatus(TicketStatus.PENDING_APPROVAL);

        return toResponse(ticketRepository.save(ticket));
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
        return toResponse(ticketRepository.save(ticket));
    }

    @Transactional(readOnly = true)
    public TicketResponse getTicketDetails(Long ticketId) throws TicketNotFoundException {
        return toResponse(getTicketOrThrow(ticketId));
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> findNearbyTickets(Double latitude, Double longitude, Double radiusKm) {
        double effectiveRadius = radiusKm == null ? 5.0 : radiusKm;
        if (latitude == null || longitude == null || effectiveRadius < 0) {
            return List.of();
        }

        return ticketRepository.findAllWithCoordinates()
            .stream()
            .map(ticket -> new NearbyTicket(ticket, haversine(latitude, longitude,
                ticket.getUser().getLocation().getLatitude(), ticket.getUser().getLocation().getLongitude())))
            .filter(candidate -> candidate.distanceKm <= effectiveRadius)
            .sorted(Comparator.comparingDouble(candidate -> candidate.distanceKm))
            .map(candidate -> toResponse(candidate.ticket))
            .toList();
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
        return new TicketResponse(
            ticket.getId(),
            ticket.getServiceType(),
            ticket.getDescription(),
            ticket.getUser() != null && ticket.getUser().getLocation() != null
                ? ticket.getUser().getLocation().getAddress()
                : null,
            ticket.getStatus(),
            ticket.getPriority(),
            ticket.getEstimatedCost(),
            ticket.getCreatedAt(),
            providerName
        );
    }

    private void updateUserLocation(User user, CreateTicketRequest request) {
        if (request.getLocation() == null || request.getLocation().isBlank()) {
            return;
        }
        if (user.getLocation() == null) {
            com.example.backend.domain.location.Location location = new com.example.backend.domain.location.Location();
            location.setAddress(request.getLocation());
            location.setLatitude(request.getLatitude());
            location.setLongitude(request.getLongitude());
            user.setLocation(location);
        } else {
            user.getLocation().setAddress(request.getLocation());
            user.getLocation().setLatitude(request.getLatitude());
            user.getLocation().setLongitude(request.getLongitude());
        }
        userRepository.save(user);
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

