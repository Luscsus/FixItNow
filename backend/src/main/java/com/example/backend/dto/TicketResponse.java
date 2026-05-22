package com.example.backend.dto;

import com.example.backend.domain.ticket.TicketPriority;
import com.example.backend.domain.ticket.TicketStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class TicketResponse {

    private Long id;
    private String serviceType;
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
    private String submittedByName;

    public TicketResponse() {
    }

    public TicketResponse(Long id, String serviceType, String description, String location, TicketStatus status,
                          TicketPriority priority, BigDecimal estimatedCost, LocalDateTime createdAt,
                          String assignedServiceProviderName, String submittedByName) {
        this.id = id;
        this.serviceType = serviceType;
        this.description = description;
        this.location = location;
        this.status = status;
        this.priority = priority;
        this.estimatedCost = estimatedCost;
        this.createdAt = createdAt;
        this.assignedServiceProviderName = assignedServiceProviderName;
        this.submittedByName = submittedByName;
    }
}
