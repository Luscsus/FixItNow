package com.example.backend.service;

import com.example.backend.domain.ticket.TicketStatus;
import com.example.backend.domain.user.UserStatus;
import com.example.backend.repository.ProviderRepository;
import com.example.backend.repository.ReviewRepository;
import com.example.backend.repository.TicketRepository;
import com.example.backend.repository.TicketStatusHistoryRepository;
import com.example.backend.web.dto.response.PublicStatsResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

/**
 * Aggregate marketplace stats for the public landing page. All queries are
 * read-only and run inside a single transaction so the snapshot is internally
 * consistent (e.g. average rating and review count come from the same view).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PublicStatsService {

    private final TicketRepository ticketRepository;
    private final TicketStatusHistoryRepository ticketHistoryRepository;
    private final ProviderRepository providerRepository;
    private final ReviewRepository reviewRepository;

    @PersistenceContext
    private final EntityManager entityManager;

    public PublicStatsResponse getStats() {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

        long completedAllTime = countCompletedAllTime();
        long completedLast30Days = countCompletedSince(thirtyDaysAgo);

        Double avgRating = avgRatingOrNull();
        long reviewCount = reviewRepository.count();

        long activeProviders = countActiveProviders();
        long citiesServed = countDistinctCities();

        Double sameDayRate = computeSameDayFixRate();
        Long medianResponseMinutes = computeMedianResponseMinutes();

        return PublicStatsResponse.builder()
            .completedTicketsLast30Days(completedLast30Days)
            .completedTicketsAllTime(completedAllTime)
            .averageRating(avgRating)
            .reviewCount(reviewCount)
            .activeProvidersCount(activeProviders)
            .citiesServedCount(citiesServed)
            .sameDayFixRate(sameDayRate)
            .medianResponseMinutes(medianResponseMinutes)
            .build();
    }

    // ─── Tickets ─────────────────────────────────────────────────────────────

    private long countCompletedAllTime() {
        Number n = (Number) entityManager
            .createQuery("SELECT COUNT(t) FROM Ticket t WHERE t.status = :s")
            .setParameter("s", TicketStatus.COMPLETED)
            .getSingleResult();
        return n == null ? 0L : n.longValue();
    }

    private long countCompletedSince(LocalDateTime since) {
        // "Completed since" means: at least one COMPLETED history row dated
        // ≥ `since`. We use history (not ticket.updated_at) because the latter
        // moves with any field edit.
        Number n = (Number) entityManager
            .createQuery(
                "SELECT COUNT(DISTINCT h.ticket.id) FROM TicketStatusHistory h " +
                "WHERE h.status = :s AND h.changedAt >= :since"
            )
            .setParameter("s", TicketStatus.COMPLETED)
            .setParameter("since", since)
            .getSingleResult();
        return n == null ? 0L : n.longValue();
    }

    /**
     * Fraction of COMPLETED tickets whose completion-history row landed within
     * 24 h of the ticket's creation. Returns null when there are no completed
     * tickets yet.
     */
    private Double computeSameDayFixRate() {
        // Pull (createdAt, completedAt) pairs in one round-trip.
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager
            .createQuery(
                "SELECT h.ticket.createdAt, h.changedAt " +
                "FROM TicketStatusHistory h WHERE h.status = :s"
            )
            .setParameter("s", TicketStatus.COMPLETED)
            .getResultList();

        if (rows.isEmpty()) return null;

        long fast = 0;
        for (Object[] row : rows) {
            LocalDateTime created = (LocalDateTime) row[0];
            LocalDateTime completed = (LocalDateTime) row[1];
            if (created == null || completed == null) continue;
            if (Duration.between(created, completed).toHours() <= 24) {
                fast++;
            }
        }
        return (double) fast / rows.size();
    }

    /**
     * Median minutes from ticket creation → first APPROVED transition.
     * Null when no tickets have been approved yet.
     */
    private Long computeMedianResponseMinutes() {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager
            .createQuery(
                "SELECT h.ticket.createdAt, MIN(h.changedAt) " +
                "FROM TicketStatusHistory h " +
                "WHERE h.status = :s " +
                "GROUP BY h.ticket.id, h.ticket.createdAt"
            )
            .setParameter("s", TicketStatus.APPROVED)
            .getResultList();

        if (rows.isEmpty()) return null;

        // Convert to minute deltas, sort, take middle.
        List<Long> deltas = new java.util.ArrayList<>(rows.size());
        for (Object[] row : rows) {
            LocalDateTime created = (LocalDateTime) row[0];
            LocalDateTime approved = (LocalDateTime) row[1];
            if (created == null || approved == null) continue;
            deltas.add(Duration.between(created, approved).toMinutes());
        }
        if (deltas.isEmpty()) return null;
        Collections.sort(deltas);
        return deltas.get(deltas.size() / 2);
    }

    // ─── Providers ───────────────────────────────────────────────────────────

    private long countActiveProviders() {
        Number n = (Number) entityManager
            .createQuery("SELECT COUNT(p) FROM Provider p WHERE p.status = :s")
            .setParameter("s", UserStatus.ACTIVE)
            .getSingleResult();
        return n == null ? 0L : n.longValue();
    }

    /** Distinct cities across all providers that have a city on file. */
    private long countDistinctCities() {
        Number n = (Number) entityManager
            .createQuery(
                "SELECT COUNT(DISTINCT LOWER(p.location.city)) " +
                "FROM Provider p WHERE p.location.city IS NOT NULL " +
                "AND p.location.city <> ''"
            )
            .getSingleResult();
        return n == null ? 0L : n.longValue();
    }

    // ─── Reviews ─────────────────────────────────────────────────────────────

    private Double avgRatingOrNull() {
        Number n = (Number) entityManager
            .createQuery("SELECT AVG(r.rating) FROM Review r")
            .getSingleResult();
        return n == null ? null : n.doubleValue();
    }
}
