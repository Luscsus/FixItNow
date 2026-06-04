package com.example.backend.service;

import com.example.backend.domain.ticket.Ticket;
import com.example.backend.domain.ticket.TicketPriority;
import com.example.backend.domain.ticket.TicketStatus;
import com.example.backend.domain.ticket.TicketStatusHistory;
import com.example.backend.dto.CreateTicketRequest;
import com.example.backend.dto.OpenTicketSummary;
import com.example.backend.dto.TicketResponse;
import com.example.backend.web.dto.response.MatchingOpenTicketResponse;
import com.example.backend.web.dto.response.RecentActivityResponse;
import com.example.backend.exception.InvalidTicketStatusTransitionException;
import com.example.backend.exception.TicketNotFoundException;
import com.example.backend.exception.UserNotFoundException;
import com.example.backend.repository.ProviderRepository;
import com.example.backend.repository.TicketRepository;
import com.example.backend.repository.TicketStatusHistoryRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.LocationRepository;
import com.example.backend.repository.ChatRoomRepository;
import com.example.backend.domain.chat.ChatRoom;
import com.example.backend.domain.user.Provider;
import com.example.backend.domain.user.User;
import com.example.backend.domain.location.Location;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.backend.common.exception.ApiException;

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
    private final CloudinaryService cloudinaryService;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatService chatService;
    private final CalendarService calendarService;
    private final TicketStatusHistoryRepository statusHistoryRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    public TicketService(TicketRepository ticketRepository, UserRepository userRepository,
                         LocationRepository locationRepository, ProviderRepository providerRepository,
                         CloudinaryService cloudinaryService,
                         ChatRoomRepository chatRoomRepository, ChatService chatService, CalendarService calendarService,
                         TicketStatusHistoryRepository statusHistoryRepository,
                         EmailService emailService, NotificationService notificationService) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.locationRepository = locationRepository;
        this.providerRepository = providerRepository;
        this.chatRoomRepository = chatRoomRepository;
        this.chatService = chatService;
        this.calendarService = calendarService;
        this.statusHistoryRepository = statusHistoryRepository;
        this.cloudinaryService = cloudinaryService;
        this.emailService = emailService;
        this.notificationService = notificationService;
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
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            ticket.setImageUrls(request.getImageUrls());
        }

        UUID assignedProviderId = request.getAssignedProviderId();
        if (assignedProviderId != null) {
            Provider provider = providerRepository.findById(assignedProviderId)
                .orElseThrow(() -> new UserNotFoundException("Provider not found: " + assignedProviderId));
            ticket.setAssignedServiceProvider(provider);

            // A specific provider requires a concrete time inside their availability.
            if (request.getRequestedStartAt() == null || request.getRequestedEndAt() == null) {
                throw new ApiException("Please choose a time within the provider's availability.");
            }
            calendarService.validateRequestedSlot(
                assignedProviderId,
                request.getRequestedStartAt(),
                request.getRequestedEndAt(),
                null);
            ticket.setRequestedStartAt(request.getRequestedStartAt());
            ticket.setRequestedEndAt(request.getRequestedEndAt());
        }

        Ticket saved = ticketRepository.save(ticket);
        recordHistory(saved, TicketStatus.PENDING_APPROVAL);

        if (assignedProviderId != null) {
            ensureChatRoom(saved, assignedProviderId);
            saved = ticketRepository.save(saved);
            // Note: the requested slot is NOT booked on the provider's calendar yet —
            // a BOOKED block is only created once the provider accepts the ticket.
            // Opening greeting so the chat isn't empty when the provider opens it
            postSystemMessage(saved, "Ticket " + formatTicketCode(saved.getId())
                + " · " + saved.getServiceType() + " · awaiting provider response.");
            // Let the requested provider know a customer picked them directly.
            notifyProviderOfInboundRequest(saved);
        }
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

        // Block transition to APPROVED if the assigned provider hasn't set up
        // payout details. Same gate as acceptOpenTicket / confirmTicket.
        if (newStatus == TicketStatus.APPROVED && ticket.getAssignedServiceProvider() != null) {
            ensureProviderCanAcceptWork(ticket.getAssignedServiceProvider());
        }

        ticket.setStatus(newStatus);
        Ticket saved = ticketRepository.save(ticket);
        recordHistory(saved, newStatus);
        calendarService.syncBookedBlockForTicket(saved);
        if (currentStatus != newStatus) {
            String chatBody = statusChangeMessage(saved, currentStatus, newStatus);
            if (chatBody != null) {
                postSystemMessage(saved, chatBody);
            }
            notifyCustomerOfStatusChange(saved, newStatus);
        }
        return toResponse(saved);
    }

    /**
     * Customer-initiated cancellation. Only the ticket owner may cancel, and only
     * while the ticket is still awaiting the provider's response (PENDING_APPROVAL).
     * Once a provider has accepted, the customer can no longer cancel from here.
     */
    @Transactional
    public TicketResponse cancelTicketByCustomer(Long ticketId, UUID userId) {
        Ticket ticket = getTicketOrThrow(ticketId);
        if (ticket.getUser() == null || !ticket.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Only the ticket owner can cancel this ticket.");
        }
        if (ticket.getStatus() != TicketStatus.PENDING_APPROVAL) {
            throw new InvalidTicketStatusTransitionException(
                "Ticket " + ticketId + " can only be cancelled while awaiting provider approval (status: "
                    + ticket.getStatus() + ")");
        }
        ticket.setStatus(TicketStatus.CANCELLED);
        Ticket saved = ticketRepository.save(ticket);
        recordHistory(saved, TicketStatus.CANCELLED);
        calendarService.syncBookedBlockForTicket(saved);
        String chatBody = statusChangeMessage(saved, TicketStatus.PENDING_APPROVAL, TicketStatus.CANCELLED);
        if (chatBody != null) {
            postSystemMessage(saved, chatBody);
        }
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
        attachProviderBankDetails(ticket, resp);
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

    /**
     * Open tickets that match the given provider's trade categories AND fall
     * within their service radius, nearest first. Returns an empty list when the
     * provider has no geocoded location, no categories, or no matches — the UI
     * renders a graceful empty state in that case.
     */
    @Transactional(readOnly = true)
    public List<MatchingOpenTicketResponse> getMatchingOpenTickets(UUID providerId) {
        Provider provider = providerRepository.findById(providerId).orElse(null);
        if (provider == null) return List.of();

        Location pLoc = provider.getLocation();
        java.util.Set<com.example.backend.domain.user.ServiceCategory> categories = provider.getCategories();
        if (pLoc == null || pLoc.getLatitude() == null || pLoc.getLongitude() == null
                || categories == null || categories.isEmpty()) {
            return List.of();
        }
        double radiusKm = provider.getServiceRadiusKm() != null ? provider.getServiceRadiusKm() : 25.0;

        return ticketRepository
                .findByAssignedServiceProviderIsNullAndStatusOrderByCreatedAtDesc(TicketStatus.PENDING_APPROVAL)
                .stream()
                .filter(t -> categories.contains(t.getCategory()))
                .filter(t -> t.getLocation() != null
                        && t.getLocation().getLatitude() != null
                        && t.getLocation().getLongitude() != null)
                .map(t -> new NearbyTicket(t, haversine(
                        pLoc.getLatitude(), pLoc.getLongitude(),
                        t.getLocation().getLatitude(), t.getLocation().getLongitude())))
                .filter(c -> c.distanceKm <= radiusKm)
                .sorted(Comparator.comparingDouble(c -> c.distanceKm))
                .limit(8)
                .map(c -> new MatchingOpenTicketResponse(
                        c.ticket.getId(),
                        c.ticket.getCategory(),
                        c.ticket.getServiceType(),
                        c.ticket.getLocation().getCity(),
                        c.ticket.getEstimatedCost(),
                        Math.round(c.distanceKm * 10.0) / 10.0))
                .toList();
    }

    /**
     * Recent platform-wide activity (completed / en-route / approved jobs) for
     * the public landing feed. The actor is the assigned provider, anonymized
     * to first name + last initial. Customer identity is never exposed.
     */
    @Transactional(readOnly = true)
    public List<RecentActivityResponse> getRecentActivity(int limit) {
        int capped = Math.max(1, Math.min(limit, 20));
        List<TicketStatus> statuses = List.of(
                TicketStatus.COMPLETED, TicketStatus.IN_TRANSIT, TicketStatus.APPROVED);

        return statusHistoryRepository
                .findRecentActivity(statuses, org.springframework.data.domain.PageRequest.of(0, capped))
                .stream()
                .map(h -> {
                    Ticket t = h.getTicket();
                    User provider = t.getAssignedServiceProvider();
                    String actor = anonymizeName(provider);
                    String city = t.getLocation() != null ? t.getLocation().getCity() : null;
                    java.math.BigDecimal amount = h.getStatus() == TicketStatus.COMPLETED
                            ? t.getEstimatedCost() : null;
                    return new RecentActivityResponse(
                            actor, t.getCategory(), t.getServiceType(),
                            city, h.getStatus(), h.getChangedAt(), amount);
                })
                .toList();
    }

    /** "Marko Novak" -> "Marko N." ; falls back gracefully on missing parts. */
    private static String anonymizeName(User u) {
        if (u == null) return "A provider";
        String first = u.getFirstName() != null ? u.getFirstName().trim() : "";
        String last = u.getLastName() != null ? u.getLastName().trim() : "";
        if (first.isEmpty() && last.isEmpty()) return "A provider";
        if (last.isEmpty()) return first;
        return first + " " + last.charAt(0) + ".";
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
        ensureProviderCanAcceptWork(ticket.getAssignedServiceProvider());
        ticket.setStatus(TicketStatus.APPROVED);
        if (ticket.getRequestedStartAt() != null && ticket.getRequestedEndAt() != null) {
            ticket.setScheduledStartAt(ticket.getRequestedStartAt());
            ticket.setScheduledEndAt(ticket.getRequestedEndAt());
        }
        Ticket saved = ticketRepository.save(ticket);
        recordHistory(saved, TicketStatus.APPROVED);
        calendarService.syncBookedBlockForTicket(saved);
        notifyCustomerOfStatusChange(saved, TicketStatus.APPROVED);
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
        ensureProviderCanAcceptWork(provider);
        ticket.setAssignedServiceProvider(provider);
        ticket.setStatus(TicketStatus.APPROVED);
        ensureChatRoom(ticket, provider.getId());
        Ticket saved = ticketRepository.save(ticket);
        recordHistory(saved, TicketStatus.APPROVED);
        String acceptedMsg = formatProviderName(provider)
            + " accepted ticket " + formatTicketCode(saved.getId());
        postSystemMessage(saved, acceptedMsg);
        notifyCustomerOfStatusChange(saved, TicketStatus.APPROVED);
        return toResponse(saved);
    }

    /**
     * Provider-initiated release. The assigned provider steps back from a ticket
     * they have accepted (APPROVED) but not yet started, returning it to the open
     * pool (no assignee, PENDING_APPROVAL) so another provider can pick it up.
     * The booked calendar slot is freed and the chat room is removed so the next
     * provider starts a clean conversation.
     */
    @Transactional
    public TicketResponse releaseTicket(Long ticketId, UUID providerId) {
        Ticket ticket = getTicketOrThrow(ticketId);
        if (ticket.getAssignedServiceProvider() == null
                || !ticket.getAssignedServiceProvider().getId().equals(providerId)) {
            throw new AccessDeniedException("Only the assigned provider can release this ticket.");
        }
        if (ticket.getStatus() != TicketStatus.APPROVED) {
            throw new InvalidTicketStatusTransitionException(
                "Ticket " + ticketId + " can only be released while it is approved (status: "
                    + ticket.getStatus() + ")");
        }

        // Hand the ticket back to the open pool.
        ticket.setAssignedServiceProvider(null);
        ticket.setStatus(TicketStatus.PENDING_APPROVAL);
        ticket.setScheduledStartAt(null);
        ticket.setScheduledEndAt(null);

        // Drop the chat room (cascades to its messages) so the next provider gets
        // a fresh conversation; a new room is created when someone re-accepts.
        UUID chatRoomId = ticket.getChatRoomId();
        ticket.setChatRoomId(null);

        Ticket saved = ticketRepository.save(ticket);
        if (chatRoomId != null) {
            chatRoomRepository.deleteById(chatRoomId);
        }
        recordHistory(saved, TicketStatus.PENDING_APPROVAL);
        // Status is now PENDING_APPROVAL, so this removes the BOOKED block.
        calendarService.syncBookedBlockForTicket(saved);
        notifyCustomer(saved, "notifications.ticket.body.RELEASED",
            "Your provider stepped back — the ticket is open for another provider.");
        return toResponse(saved);
    }

    @Transactional
    public TicketResponse issueInvoice(Long ticketId, java.math.BigDecimal amount, byte[] pdfBytes) {
        Ticket ticket = getTicketOrThrow(ticketId);
        if (ticket.getStatus() != TicketStatus.PENDING_PROVIDER_INVOICE) {
            throw new InvalidTicketStatusTransitionException(
                "Invoice can only be issued when ticket is in PENDING_PROVIDER_INVOICE status (current: " + ticket.getStatus() + ")");
        }
        if (amount == null || amount.compareTo(java.math.BigDecimal.ONE) < 0) {
            throw new ApiException("Invoice amount must be at least €1.00.");
        }
        ticket.setEstimatedCost(amount);
        ticket.setStatus(TicketStatus.PENDING_PAYMENT);
        Ticket saved = ticketRepository.save(ticket);
        recordHistory(saved, TicketStatus.PENDING_PAYMENT);
        calendarService.syncBookedBlockForTicket(saved);
        String invoiceMsg = "Invoice issued · €" + amount.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString() + " · awaiting payment.";
        postSystemMessage(saved, invoiceMsg);
        notifyCustomerOfStatusChange(saved, TicketStatus.PENDING_PAYMENT);

        // Email the invoice PDF to the customer
        try {
            User customer = saved.getUser();
            String providerName = saved.getAssignedServiceProvider() != null
                ? formatProviderName(saved.getAssignedServiceProvider())
                : "Your provider";
            emailService.sendInvoiceEmail(
                customer.getEmail(),
                customer.getFirstName() != null ? customer.getFirstName() : customer.getEmail(),
                formatTicketCode(saved.getId()),
                saved.getServiceType(),
                providerName,
                amount,
                pdfBytes
            );
        } catch (RuntimeException ex) {
            System.err.println("[ticket] invoice email failed for ticket " + ticketId + ": " + ex.getMessage());
        }

        return toResponse(saved);
    }

    /**
     * Marks a ticket's invoice as paid and advances it to COMPLETED. Called from
     * the Stripe webhook (authoritative) and from the on-return confirmation
     * fallback. Idempotent: if the ticket is already COMPLETED this is a no-op,
     * so a webhook + confirm race can't double-process or throw.
     */
    @Transactional
    public TicketResponse markTicketPaid(Long ticketId, String paymentIntentId) {
        Ticket ticket = getTicketOrThrow(ticketId);

        // Already settled — record the payment-intent if we didn't have it and return.
        if (ticket.getStatus() == TicketStatus.COMPLETED || ticket.getPaidAt() != null) {
            if (paymentIntentId != null && ticket.getStripePaymentIntentId() == null) {
                ticket.setStripePaymentIntentId(paymentIntentId);
                ticketRepository.save(ticket);
            }
            return toResponse(ticket);
        }

        if (ticket.getStatus() != TicketStatus.PENDING_PAYMENT) {
            throw new InvalidTicketStatusTransitionException(
                "Payment can only be recorded for a ticket awaiting payment (current: " + ticket.getStatus() + ")");
        }

        ticket.setStatus(TicketStatus.COMPLETED);
        ticket.setPaidAt(LocalDateTime.now());
        if (paymentIntentId != null) {
            ticket.setStripePaymentIntentId(paymentIntentId);
        }
        Ticket saved = ticketRepository.save(ticket);
        recordHistory(saved, TicketStatus.COMPLETED);
        calendarService.syncBookedBlockForTicket(saved);

        postSystemMessage(saved, "Payment received · ticket " + formatTicketCode(saved.getId()) + " complete. Thank you!");
        notifyCustomerOfStatusChange(saved, TicketStatus.COMPLETED);
        notifyProviderOfPayment(saved);
        return toResponse(saved);
    }

    @Transactional
    public void deleteTicket(Long ticketId, UUID userId) {
        Ticket ticket = getTicketOrThrow(ticketId);
        if (!ticket.getUser().getId().equals(userId)) {
            throw new ApiException("You are not authorized to delete this ticket.");
        }
        deleteTicketInternal(ticket);
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getAllTickets() {
        return ticketRepository.findAll()
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public TicketResponse adminUpdateTicket(Long ticketId, TicketStatus newStatus, TicketPriority newPriority) {
        Ticket ticket = getTicketOrThrow(ticketId);

        if (newPriority != null) {
            ticket.setPriority(newPriority);
        }

        TicketStatus currentStatus = ticket.getStatus();
        boolean statusChanged = newStatus != null && newStatus != currentStatus;
        if (newStatus != null) {
            // Admin override — bypass the normal state-machine validation.
            ticket.setStatus(newStatus);
        }

        Ticket saved = ticketRepository.save(ticket);

        if (statusChanged) {
            recordHistory(saved, newStatus);
            calendarService.syncBookedBlockForTicket(saved);
            String chatBody = statusChangeMessage(saved, currentStatus, newStatus);
            if (chatBody != null) {
                postSystemMessage(saved, chatBody);
            }
            notifyCustomerOfStatusChange(saved, newStatus);
        }
        return toResponse(saved);
    }

    @Transactional
    public void adminDeleteTicket(Long ticketId) {
        Ticket ticket = getTicketOrThrow(ticketId);
        deleteTicketInternal(ticket);
    }

    private void deleteTicketInternal(Ticket ticket) {
        if (ticket.getImageUrls() != null) {
            ticket.getImageUrls().forEach(cloudinaryService::deleteImage);
        }
        ticketRepository.delete(ticket);
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

    private static String formatTicketCode(Long id) {
        return String.format("FIX-%04d", id);
    }

    /**
     * Posts a SYSTEM message into the ticket's chat room (if one exists). Failures
     * are swallowed so chat issues never break the primary ticket operation.
     */
    private void postSystemMessage(Ticket ticket, String content) {
        if (ticket.getChatRoomId() == null) return;
        try {
            chatService.saveSystemMessage(ticket.getChatRoomId(), content);
        } catch (RuntimeException ex) {
            // Don't fail the ticket op if the chat write fails — log and move on.
            System.err.println("[ticket] system message failed for ticket " + ticket.getId() + ": " + ex.getMessage());
        }
    }

    /**
     * Raise an in-app notification for the customer about a ticket lifecycle change.
     * Status changes are always provider-initiated (the status endpoints are PROVIDER-only),
     * so the recipient is the ticket's customer. Failures are swallowed so the ticket op survives.
     */
    private void notifyCustomerOfStatusChange(Ticket ticket, TicketStatus status) {
        notifyCustomer(ticket, notificationBodyKeyForStatus(status), notificationBodyForStatus(status));
    }

    /**
     * Low-level customer notification for a ticket. {@code fallbackBody} is the English
     * text stored on the row; {@code bodyKey} is the i18next key the client renders in the
     * user's language. The title is always "Ticket FIX-XXXX" with the code passed as the
     * {@code code} interpolation param. No-ops (like the old behaviour) when there's no
     * customer or no body to show.
     */
    /**
     * Notify a directly-requested provider that a customer opened a ticket and picked
     * them specifically. Fired on ticket creation when an assigned provider is set.
     * Preference-gated ({@code inboundRequests}); failures are swallowed.
     */
    private void notifyProviderOfInboundRequest(Ticket ticket) {
        User provider = ticket.getAssignedServiceProvider();
        if (provider == null) return;
        try {
            String code = formatTicketCode(ticket.getId());
            String customer = ticket.getUser() != null ? ticket.getUser().displayName() : "A customer";
            notificationService.notifyInboundRequest(
                ticket.getId(),
                provider.getId(),
                "Ticket " + code,
                customer + " requested you for " + ticket.getServiceType() + ".",
                "notifications.inbound.title",
                "notifications.inbound.body",
                java.util.Map.of("code", code, "customerName", customer, "service", ticket.getServiceType())
            );
        } catch (RuntimeException ex) {
            System.err.println("[ticket] inbound-request notification failed for ticket " + ticket.getId() + ": " + ex.getMessage());
        }
    }

    /**
     * Notify the assigned provider that the customer paid the invoice and the ticket
     * is now complete. Preference-gated ({@code paymentReceived}); failures are swallowed.
     */
    private void notifyProviderOfPayment(Ticket ticket) {
        User provider = ticket.getAssignedServiceProvider();
        if (provider == null) return;
        try {
            String code = formatTicketCode(ticket.getId());
            notificationService.notifyPaymentReceived(
                ticket.getId(),
                provider.getId(),
                "Ticket " + code,
                "Payment received — " + code + " is complete.",
                "notifications.payment.title",
                "notifications.payment.body",
                java.util.Map.of("code", code)
            );
        } catch (RuntimeException ex) {
            System.err.println("[ticket] payment notification failed for ticket " + ticket.getId() + ": " + ex.getMessage());
        }
    }

    private void notifyCustomer(Ticket ticket, String bodyKey, String fallbackBody) {
        if (ticket.getUser() == null || fallbackBody == null) return;
        try {
            String code = formatTicketCode(ticket.getId());
            notificationService.notifyTicketStatusChange(
                ticket.getId(),
                ticket.getUser().getId(),
                "Ticket " + code,
                fallbackBody,
                "notifications.ticket.title",
                bodyKey,
                java.util.Map.of("code", code)
            );
        } catch (RuntimeException ex) {
            System.err.println("[ticket] notification failed for ticket " + ticket.getId() + ": " + ex.getMessage());
        }
    }

    /** Human-readable message for ticket lifecycle transitions, or null for transitions we don't surface. */
    private String statusChangeMessage(Ticket ticket, TicketStatus from, TicketStatus to) {
        String code = formatTicketCode(ticket.getId());
        return switch (to) {
            case APPROVED                 -> "Ticket " + code + " approved · awaiting provider en-route.";
            case IN_TRANSIT               -> "Provider is en route · ticket " + code + ".";
            case PENDING_PROVIDER_INVOICE -> "Work complete · awaiting provider invoice.";
            case PENDING_PAYMENT          -> "Invoice issued · awaiting payment.";
            case COMPLETED                -> "Ticket " + code + " marked complete. Thanks!";
            case CANCELLED                -> "Ticket " + code + " was cancelled.";
            case DECLINED                 -> "Ticket " + code + " was declined.";
            case PENDING_APPROVAL         -> null; // no message — initial state
        };
    }

    /** Notification body for ticket status changes — mirrors the STATUS_EVENT_LABEL map in the frontend UI. */
    private String notificationBodyForStatus(TicketStatus to) {
        return switch (to) {
            case APPROVED                 -> "Provider accepted — ticket approved.";
            case IN_TRANSIT               -> "Provider marked as in transit.";
            case PENDING_PROVIDER_INVOICE -> "Work completed — awaiting invoice.";
            case PENDING_PAYMENT          -> "Invoice received — payment pending.";
            case COMPLETED                -> "Ticket resolved and closed.";
            case CANCELLED                -> "Ticket was cancelled.";
            case DECLINED                 -> "Ticket was declined.";
            case PENDING_APPROVAL         -> null;
        };
    }

    /** i18next body key for a ticket status change, mirroring {@link #notificationBodyForStatus}. */
    private String notificationBodyKeyForStatus(TicketStatus to) {
        return switch (to) {
            case APPROVED, IN_TRANSIT, PENDING_PROVIDER_INVOICE, PENDING_PAYMENT,
                 COMPLETED, CANCELLED, DECLINED -> "notifications.ticket.body." + to.name();
            case PENDING_APPROVAL              -> null;
        };
    }

    private Ticket getTicketOrThrow(Long ticketId) {
        return ticketRepository.findById(ticketId)
            .orElseThrow(() -> new TicketNotFoundException("Ticket not found: " + ticketId));
    }

    /**
     * Provider can't take on a job until they've set their payout details, or
     * the customer would have no way to pay them. Called from every code path
     * that transitions a ticket to APPROVED.
     * <p>
     * Takes the assigned account as a {@code User} because that's how the ticket
     * holds it. We do NOT use {@code instanceof Provider} — under lazy loading
     * Hibernate returns a {@code User} proxy that fails the type check even when
     * the underlying row really is a provider. Instead we re-fetch through the
     * provider repository by id, which both unwraps the proxy and confirms the
     * account is a provider.
     * <p>
     * BIC/SWIFT is not required (the SEPA EPC QR spec allows omitting it for
     * EEA transfers), so we only enforce account holder, IBAN, and bank name.
     */
    private void ensureProviderCanAcceptWork(User assigned) {
        if (assigned == null) {
            throw new ApiException("This ticket has no assigned provider yet.");
        }
        Provider provider = providerRepository.findById(assigned.getId())
            .orElseThrow(() -> new ApiException("Assigned account is not a provider."));
        if (isBlank(provider.getBankAccountHolder())
                || isBlank(provider.getBankIban())
                || isBlank(provider.getBankName())) {
            throw new ApiException(
                "Add your payout details (bank info) before accepting work. "
                + "You can set them on your profile."
            );
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
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
        // displayName() masks soft-deleted accounts ("Deleted User" / "Former Customer").
        String providerName = ticket.getAssignedServiceProvider() != null
            ? ticket.getAssignedServiceProvider().displayName()
            : null;
        UUID providerId = ticket.getAssignedServiceProvider() != null
            ? ticket.getAssignedServiceProvider().getId()
            : null;
        String providerProfilePictureUrl = ticket.getAssignedServiceProvider() != null
            ? ticket.getAssignedServiceProvider().getProfilePictureUrl()
            : null;
        String submittedByName = ticket.getUser() != null
            ? ticket.getUser().displayName()
            : null;
        String submittedByProfilePictureUrl = ticket.getUser() != null
            ? ticket.getUser().getProfilePictureUrl()
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
            submittedByName,
            ticket.getChatRoomId()
        );
        resp.setAssignedServiceProviderId(providerId);
        resp.setAssignedServiceProviderProfilePictureUrl(providerProfilePictureUrl);
        resp.setSubmittedById(ticket.getUser() != null ? ticket.getUser().getId() : null);
        resp.setSubmittedByProfilePictureUrl(submittedByProfilePictureUrl);
        resp.setImageUrls(ticket.getImageUrls() != null ? ticket.getImageUrls() : List.of());
        resp.setRequestedStartAt(ticket.getRequestedStartAt());
        resp.setRequestedEndAt(ticket.getRequestedEndAt());
        return resp;
    }

    /**
     * Fills in the assigned provider's current bank/payout details on a detail
     * response so the customer's invoice PDF shows the real account (not the mock
     * fallback). Re-fetches through the provider repository because the ticket
     * holds the provider as a lazy {@code User} proxy without the bank columns.
     */
    private void attachProviderBankDetails(Ticket ticket, TicketResponse resp) {
        if (ticket.getAssignedServiceProvider() == null) return;
        Provider provider = providerRepository.findById(ticket.getAssignedServiceProvider().getId()).orElse(null);
        if (provider == null) return;
        resp.setBankAccountHolder(provider.getBankAccountHolder());
        resp.setBankIban(provider.getBankIban());
        resp.setBankBic(provider.getBankBic());
        resp.setBankName(provider.getBankName());
        Location loc = provider.getLocation();
        if (loc != null) {
            resp.setBankRecipientStreet(joinNonBlank(loc.getStreetName(), loc.getStreetNumber()));
            resp.setBankRecipientCity(joinNonBlank(loc.getPostalCode(), loc.getCity()));
        }
    }

    /** Joins non-blank parts with a single space, or returns null when all are blank. */
    private static String joinNonBlank(String... parts) {
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            if (p != null && !p.isBlank()) {
                if (sb.length() > 0) sb.append(' ');
                sb.append(p.trim());
            }
        }
        return sb.length() == 0 ? null : sb.toString();
    }

    private void ensureChatRoom(Ticket ticket, UUID providerId) {
        if (ticket.getChatRoomId() != null) {
            return;
        }
        ChatRoom room = chatRoomRepository.findByTicketId(ticket.getId())
            .orElseGet(ChatRoom::new);
        room.setTicketId(ticket.getId());
        room.setCustomerId(ticket.getUser().getId());
        room.setProviderId(providerId);
        ChatRoom saved = chatRoomRepository.save(room);
        ticket.setChatRoomId(saved.getId());
    }

    /**
     * Build the Location for a ticket. Always creates a NEW, independent
     * Location row from the request — it must never reuse or overwrite the
     * customer's saved profile location, so changing a ticket's address can't
     * mutate their default. Falls back to a copy of the profile location only
     * when the request carries no address at all.
     */
    private Location upsertLocation(User user, CreateTicketRequest request) {
        Location location = new Location();
        if (request.getLocation() != null && !request.getLocation().isBlank()) {
            location.setStreetName(request.getLocation());
            location.setLatitude(request.getLatitude());
            location.setLongitude(request.getLongitude());
        } else if (user.getLocation() != null) {
            // No address supplied — snapshot the profile location into a fresh row.
            Location profile = user.getLocation();
            location.setStreetName(profile.getStreetName());
            location.setStreetNumber(profile.getStreetNumber());
            location.setCity(profile.getCity());
            location.setPostalCode(profile.getPostalCode());
            location.setCountry(profile.getCountry());
            location.setLatitude(profile.getLatitude());
            location.setLongitude(profile.getLongitude());
        } else {
            return null;
        }
        return locationRepository.save(location);
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
