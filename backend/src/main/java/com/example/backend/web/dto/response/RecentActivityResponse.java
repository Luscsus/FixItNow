package com.example.backend.web.dto.response;

import com.example.backend.domain.ticket.TicketStatus;
import com.example.backend.domain.user.ServiceCategory;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A single anonymized, platform-wide activity event for the public landing
 * feed (e.g. "Marko N. completed a Plumbing job · Maribor"). The actor is the
 * assigned provider, shown as first name + last initial only.
 */
public record RecentActivityResponse(
    String actorName,
    ServiceCategory category,
    String serviceType,
    String city,
    TicketStatus status,
    LocalDateTime changedAt,
    BigDecimal amount
) {
}
