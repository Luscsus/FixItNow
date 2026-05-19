package com.example.backend.repository;

import com.example.backend.domain.ticket.Ticket;
import com.example.backend.domain.ticket.TicketPriority;
import com.example.backend.domain.ticket.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

	List<Ticket> findByUserIdOrderByCreatedAtDesc(UUID userId);

	List<Ticket> findByStatus(TicketStatus status);

	List<Ticket> findByStatusAndPriority(TicketStatus status, TicketPriority priority);

	@Query("select t from Ticket t where t.latitude is not null and t.longitude is not null")
	List<Ticket> findAllWithCoordinates();
}

