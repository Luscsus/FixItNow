package com.example.backend.web.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Aggregate marketplace statistics, shown on the public landing page.
 * Anything {@code null} means "not enough data yet" — the frontend renders
 * an em-dash or hides the tile.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicStatsResponse {

    /** Tickets resolved in the last 30 days. */
    private long completedTicketsLast30Days;

    /** Tickets resolved all-time. */
    private long completedTicketsAllTime;

    /** Mean rating across every review, or null when there are no reviews. */
    private Double averageRating;

    /** Total number of reviews submitted. */
    private long reviewCount;

    /** Currently-active providers (status = ACTIVE). */
    private long activeProvidersCount;

    /** Distinct cities present on at least one active provider's profile. */
    private long citiesServedCount;

    /**
     * Fraction of COMPLETED tickets that went from creation → completion in
     * ≤ 24 hours. Range 0.0–1.0; null when there are no completed tickets yet.
     */
    private Double sameDayFixRate;

    /**
     * Median time (in minutes) from ticket creation to first APPROVED
     * transition. Null when no tickets have been approved yet.
     */
    private Long medianResponseMinutes;
}
