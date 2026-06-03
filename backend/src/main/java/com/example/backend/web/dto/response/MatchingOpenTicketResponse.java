package com.example.backend.web.dto.response;

import com.example.backend.domain.user.ServiceCategory;

import java.math.BigDecimal;

/**
 * A single open (unassigned) ticket that matches a provider's trade categories
 * and falls within their service radius. Returned sorted by distance, nearest
 * first, for the "incoming jobs near you" widget.
 */
public record MatchingOpenTicketResponse(
    Long id,
    ServiceCategory category,
    String serviceType,
    String city,
    BigDecimal estimatedCost,
    double distanceKm
) {
}
