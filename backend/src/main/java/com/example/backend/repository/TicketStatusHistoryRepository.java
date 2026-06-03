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
     * Only includes events on tickets that have an assigned provider (so we can
     * attribute the action).
     */
    @Query("SELECT h FROM TicketStatusHistory h " +
           "JOIN h.ticket t " +
           "WHERE h.status IN :statuses " +
           "AND t.assignedServiceProvider IS NOT NULL " +
           "ORDER BY h.changedAt DESC")
    List<TicketStatusHistory> findRecentActivity(@Param("statuses") List<TicketStatus> statuses, Pageable pageable);
}
