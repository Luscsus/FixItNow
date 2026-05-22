package com.example.backend.domain.ticket;

import io.swagger.v3.oas.annotations.media.Schema;

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
public enum TicketStatus {
    PENDING_APPROVAL,
    DECLINED,
    APPROVED,
    IN_TRANSIT,
    PENDING_PROVIDER_INVOICE,
    PENDING_PAYMENT,
    COMPLETED,
    CANCELLED
}
