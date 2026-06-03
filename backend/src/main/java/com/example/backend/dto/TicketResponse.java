package com.example.backend.dto;

import com.example.backend.domain.ticket.TicketPriority;
import com.example.backend.domain.ticket.TicketStatus;
import com.example.backend.domain.user.ServiceCategory;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.List;

@Getter
@Setter
public class TicketResponse {

    private Long id;
    private String serviceType;
    private ServiceCategory category;
    private String description;
    private String location;
    @Schema(
        description = "Ticket lifecycle status",
        example = "PENDING_APPROVAL",
        allowableValues = {
            "PENDING_APPROVAL",
            "DECLINED",
            "APPROVED",
            "IN_TRANSIT",
            "PENDING_PROVIDER_INVOICE",
            "PENDING_PAYMENT",
            "COMPLETED",
            "CANCELLED"
        }
    )
    private TicketStatus status;
    private TicketPriority priority;
    private BigDecimal estimatedCost;
    private LocalDateTime createdAt;
    private String assignedServiceProviderName;
    private UUID assignedServiceProviderId;
    private String assignedServiceProviderProfilePictureUrl;
    private String submittedByName;
    private UUID submittedById;
    private String submittedByProfilePictureUrl;
    private UUID chatRoomId;
    private LocalDateTime requestedStartAt;
    private LocalDateTime requestedEndAt;
    private List<StatusHistoryEntry> statusHistory;

    // ─── Assigned provider's payout/bank details ──────────────────────────────
    // Populated only on the single-ticket detail view (getTicketDetails) so the
    // customer can render a correct invoice PDF (bank rows + payment QR) without
    // access to the provider's private profile. Null on list responses.
    private String bankAccountHolder;
    private String bankIban;
    private String bankBic;
    private String bankName;
    private String bankRecipientStreet;
    private String bankRecipientCity;

    @Getter
    @Setter
    public static class StatusHistoryEntry {
        private TicketStatus status;
        private LocalDateTime changedAt;

        public StatusHistoryEntry(TicketStatus status, LocalDateTime changedAt) {
            this.status = status;
            this.changedAt = changedAt;
        }
    }
    private List<String> imageUrls;

    public TicketResponse() {
    }

    /** Pre-chat constructor — kept for backward compatibility with any older callers. */
    public TicketResponse(Long id, String serviceType, ServiceCategory category, String description, String location,
                          TicketStatus status, TicketPriority priority, BigDecimal estimatedCost,
                          LocalDateTime createdAt, String assignedServiceProviderName, String submittedByName) {
        this(id, serviceType, category, description, location, status, priority, estimatedCost, createdAt,
            assignedServiceProviderName, submittedByName, null);
    }

    /** Full constructor — used by TicketService.toResponse(). */
    public TicketResponse(Long id, String serviceType, ServiceCategory category, String description, String location,
                          TicketStatus status, TicketPriority priority, BigDecimal estimatedCost,
                          LocalDateTime createdAt, String assignedServiceProviderName, String submittedByName,
                          UUID chatRoomId) {
        this.id = id;
        this.serviceType = serviceType;
        this.category = category;
        this.description = description;
        this.location = location;
        this.status = status;
        this.priority = priority;
        this.estimatedCost = estimatedCost;
        this.createdAt = createdAt;
        this.assignedServiceProviderName = assignedServiceProviderName;
        this.submittedByName = submittedByName;
        this.chatRoomId = chatRoomId;
    }
}
