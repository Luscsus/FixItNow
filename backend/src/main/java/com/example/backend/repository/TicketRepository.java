package com.example.backend.repository;

import com.example.backend.domain.ticket.Ticket;
import com.example.backend.domain.ticket.TicketPriority;
import com.example.backend.domain.ticket.TicketStatus;
import com.example.backend.dto.OpenTicketSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

	List<Ticket> findByUser_IdOrderByCreatedAtDesc(UUID userId);

	Optional<Ticket> findByStripeCheckoutSessionId(String stripeCheckoutSessionId);

	List<Ticket> findByStatus(TicketStatus status);

	List<Ticket> findByStatusAndPriority(TicketStatus status, TicketPriority priority);

	List<Ticket> findByAssignedServiceProvider_IdOrderByCreatedAtDesc(UUID providerId);

	List<Ticket> findByAssignedServiceProviderIsNullAndStatusOrderByCreatedAtDesc(TicketStatus status);

	@Query("select t from Ticket t join fetch t.location l where l.latitude is not null and l.longitude is not null")
	List<Ticket> findAllWithCoordinates();

	@Query("SELECT new com.example.backend.dto.OpenTicketSummary(t.serviceType, t.category) " +
		   "FROM Ticket t WHERE t.status = 'PENDING_APPROVAL' AND t.assignedServiceProvider IS NULL " +
		   "ORDER BY t.createdAt DESC LIMIT 20")
	List<OpenTicketSummary> findTop20OpenTicketSummaries();

	/**
	 * Whether this customer has at least one COMPLETED ticket assigned to this
	 * provider. Used by the review service to gate review creation — a customer
	 * can only review a provider they've actually worked with.
	 */
	boolean existsByUser_IdAndAssignedServiceProvider_IdAndStatus(
		UUID userId, UUID providerId, TicketStatus status);
}
