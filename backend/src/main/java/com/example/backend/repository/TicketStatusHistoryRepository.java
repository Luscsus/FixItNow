package com.example.backend.repository;

import com.example.backend.domain.ticket.TicketStatus;
import com.example.backend.domain.ticket.TicketStatusHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketStatusHistoryRepository extends JpaRepository<TicketStatusHistory, Long> {
    List<TicketStatusHistory> findByTicket_IdOrderByChangedAtAsc(Long ticketId);

    /**
     * Most-recent status transitions of interest, for the public activity feed.
     * Includes every matching event regardless of whether a provider is assigned;
     * a job completed via an admin override never gets an assigned provider, but
     * it is still a completed job and must show in the feed (and stay consistent
     * with the public completed-ticket counters). The actor is anonymized in the
     * service, falling back gracefully when no provider is attributed.
     */
    @Query("SELECT h FROM TicketStatusHistory h " +
           "JOIN h.ticket t " +
           "WHERE h.status IN :statuses " +
           "ORDER BY h.changedAt DESC")
    List<TicketStatusHistory> findRecentActivity(@Param("statuses") List<TicketStatus> statuses, Pageable pageable);
}
