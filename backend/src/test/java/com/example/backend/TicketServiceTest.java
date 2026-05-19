package com.example.backend;

import com.example.backend.domain.ticket.Ticket;
import com.example.backend.domain.ticket.TicketPriority;
import com.example.backend.domain.ticket.TicketStatus;
import com.example.backend.domain.user.User;
import com.example.backend.dto.CreateTicketRequest;
import com.example.backend.dto.TicketResponse;
import com.example.backend.exception.InvalidTicketStatusTransitionException;
import com.example.backend.exception.TicketNotFoundException;
import com.example.backend.exception.UserNotFoundException;
import com.example.backend.repository.TicketRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.TicketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

	@Mock
	private TicketRepository ticketRepository;

	@Mock
	private UserRepository userRepository;

	@InjectMocks
	private TicketService ticketService;

	private UUID userId;
	private User user;

	@BeforeEach
	void setUp() {
		userId = UUID.randomUUID();
		user = new User();
		user.setId(userId);
		user.setEmail("user@example.com");
		user.setPassword("secret");
		user.setFirstName("Test");
		user.setLastName("User");
	}

	@Test
	void createTicketShouldPersistOpenTicketForExistingUser() {
		CreateTicketRequest request = new CreateTicketRequest();
		request.setServiceType("pušča pipa");
		request.setDescription("V kuhinji pušča pipa");
		request.setLocation("Ljubljana");
		request.setLatitude(46.0569);
		request.setLongitude(14.5058);
		request.setPriority(TicketPriority.HIGH);

		when(userRepository.findById(userId)).thenReturn(Optional.of(user));
		when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> invocation.getArgument(0));

		TicketResponse response = ticketService.createTicket(request, userId);

		assertNotNull(response);
		assertEquals("pušča pipa", response.getServiceType());
		assertEquals(TicketStatus.OPEN, response.getStatus());
		assertEquals(TicketPriority.HIGH, response.getPriority());
		assertEquals("Ljubljana", response.getLocation());
		verify(ticketRepository).save(any(Ticket.class));
	}

	@Test
	void createTicketShouldThrowWhenUserMissing() {
		CreateTicketRequest request = new CreateTicketRequest();
		request.setServiceType("elektrika");
		request.setDescription("Stikalo ne deluje");
		request.setLocation("Maribor");

		when(userRepository.findById(userId)).thenReturn(Optional.empty());

		assertThrows(UserNotFoundException.class, () -> ticketService.createTicket(request, userId));
	}

	@Test
	void getUserTicketsShouldReturnSortedTickets() {
		Ticket first = new Ticket();
		first.setId(1L);
		first.setUser(user);
		first.setServiceType("A");
		first.setDescription("A desc");
		first.setLocation("A loc");
		first.setStatus(TicketStatus.OPEN);
		first.setPriority(TicketPriority.MEDIUM);
		first.setCreatedAt(LocalDateTime.now().minusHours(1));

		Ticket second = new Ticket();
		second.setId(2L);
		second.setUser(user);
		second.setServiceType("B");
		second.setDescription("B desc");
		second.setLocation("B loc");
		second.setStatus(TicketStatus.IN_PROGRESS);
		second.setPriority(TicketPriority.LOW);
		second.setCreatedAt(LocalDateTime.now());

		when(userRepository.existsById(userId)).thenReturn(true);
		when(ticketRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(List.of(second, first));

		List<TicketResponse> responses = ticketService.getUserTickets(userId);

		assertEquals(2, responses.size());
		assertEquals(2L, responses.get(0).getId());
		assertEquals(1L, responses.get(1).getId());
	}

	@Test
	void updateTicketStatusShouldRejectInvalidTransition() {
		Ticket ticket = new Ticket();
		ticket.setId(10L);
		ticket.setUser(user);
		ticket.setStatus(TicketStatus.COMPLETED);
		ticket.setPriority(TicketPriority.MEDIUM);
		ticket.setServiceType("service");
		ticket.setDescription("desc");
		ticket.setLocation("loc");

		when(ticketRepository.findById(10L)).thenReturn(Optional.of(ticket));

		assertThrows(InvalidTicketStatusTransitionException.class,
			() -> ticketService.updateTicketStatus(10L, TicketStatus.OPEN));
	}

	@Test
	void getTicketDetailsShouldThrowWhenMissing() {
		when(ticketRepository.findById(99L)).thenReturn(Optional.empty());
		assertThrows(TicketNotFoundException.class, () -> ticketService.getTicketDetails(99L));
	}

	@Test
	void findNearbyTicketsShouldFilterByRadius() {
		Ticket near = new Ticket();
		near.setId(1L);
		near.setUser(user);
		near.setServiceType("near");
		near.setDescription("near desc");
		near.setLocation("Ljubljana");
		near.setLatitude(46.0569);
		near.setLongitude(14.5058);
		near.setStatus(TicketStatus.OPEN);
		near.setPriority(TicketPriority.MEDIUM);

		Ticket far = new Ticket();
		far.setId(2L);
		far.setUser(user);
		far.setServiceType("far");
		far.setDescription("far desc");
		far.setLocation("Koper");
		far.setLatitude(45.5481);
		far.setLongitude(13.7302);
		far.setStatus(TicketStatus.OPEN);
		far.setPriority(TicketPriority.MEDIUM);

		when(ticketRepository.findAllWithCoordinates()).thenReturn(List.of(near, far));

		List<TicketResponse> responses = ticketService.findNearbyTickets(46.0569, 14.5058, 10.0);

		assertEquals(1, responses.size());
		assertEquals(1L, responses.get(0).getId());
	}
}

