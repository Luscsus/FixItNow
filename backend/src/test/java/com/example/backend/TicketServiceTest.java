package com.example.backend;

import com.example.backend.domain.ticket.Ticket;
import com.example.backend.domain.ticket.TicketPriority;
import com.example.backend.domain.ticket.TicketStatus;
import com.example.backend.domain.location.Location;
import com.example.backend.domain.user.ServiceCategory;
import com.example.backend.domain.user.User;
import com.example.backend.dto.CreateTicketRequest;
import com.example.backend.dto.TicketResponse;
import com.example.backend.exception.InvalidTicketStatusTransitionException;
import com.example.backend.exception.TicketNotFoundException;
import com.example.backend.exception.UserNotFoundException;
import com.example.backend.repository.ProviderRepository;
import com.example.backend.repository.TicketRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.LocationRepository;
import com.example.backend.repository.ChatRoomRepository;
import com.example.backend.repository.TicketStatusHistoryRepository;
import com.example.backend.service.CloudinaryService;
import com.example.backend.service.ChatService;
import com.example.backend.service.CalendarService;
import com.example.backend.service.EmailService;
import com.example.backend.service.NotificationService;
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

	@Mock
	private LocationRepository locationRepository;

	@Mock
	private ProviderRepository providerRepository;

	@Mock
	private CloudinaryService cloudinaryService;

	@Mock
	private ChatRoomRepository chatRoomRepository;

	@Mock
	private ChatService chatService;

	@Mock
	private CalendarService calendarService;

	@Mock
	private TicketStatusHistoryRepository statusHistoryRepository;

	@Mock
	private EmailService emailService;

	@Mock
	private NotificationService notificationService;

	@InjectMocks
	private TicketService ticketService;

	private UUID userId;
	private User user;
	private Location userLocation;

	@BeforeEach
	void setUp() {
		userId = UUID.randomUUID();
		user = new User();
		user.setId(userId);
		user.setEmail("user@example.com");
		user.setPassword("secret");
		user.setFirstName("Test");
		user.setLastName("User");
		userLocation = new Location();
		userLocation.setStreetName("Ljubljana");
		userLocation.setLatitude(46.0569);
		userLocation.setLongitude(14.5058);
		user.setLocation(userLocation);
	}

	@Test
	void createTicketShouldPersistOpenTicketForExistingUser() {
		CreateTicketRequest request = new CreateTicketRequest();
		request.setServiceType("pušča pipa");
		request.setCategory(ServiceCategory.PLUMBING);
		request.setDescription("V kuhinji pušča pipa");
		request.setLocation("Ljubljana");
		request.setLatitude(46.0569);
		request.setLongitude(14.5058);
		request.setPriority(TicketPriority.HIGH);

		when(userRepository.findById(userId)).thenReturn(Optional.of(user));
		when(locationRepository.save(any(Location.class))).thenAnswer(invocation -> invocation.getArgument(0));
		when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> invocation.getArgument(0));

		TicketResponse response = ticketService.createTicket(request, userId);

		assertNotNull(response);
		assertEquals("pušča pipa", response.getServiceType());
		assertEquals(TicketStatus.PENDING_APPROVAL, response.getStatus());
		assertEquals(TicketPriority.HIGH, response.getPriority());
		assertEquals("Ljubljana", response.getLocation());
		verify(ticketRepository).save(any(Ticket.class));
	}

	@Test
	void createTicketShouldThrowWhenUserMissing() {
		CreateTicketRequest request = new CreateTicketRequest();
		request.setServiceType("elektrika");
		request.setCategory(ServiceCategory.ELECTRICAL);
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
		Location firstLocation = new Location();
		firstLocation.setStreetName("A loc");
		firstLocation.setLatitude(46.0);
		firstLocation.setLongitude(14.0);
		first.setLocation(firstLocation);
		first.setServiceType("A");
		first.setDescription("A desc");
		first.setStatus(TicketStatus.PENDING_APPROVAL);
		first.setPriority(TicketPriority.MEDIUM);
		first.setCreatedAt(LocalDateTime.now().minusHours(1));

		Ticket second = new Ticket();
		second.setId(2L);
		second.setUser(user);
		Location secondLocation = new Location();
		secondLocation.setStreetName("B loc");
		secondLocation.setLatitude(46.1);
		secondLocation.setLongitude(14.1);
		second.setLocation(secondLocation);
		second.setServiceType("B");
		second.setDescription("B desc");
		second.setStatus(TicketStatus.IN_TRANSIT);
		second.setPriority(TicketPriority.LOW);
		second.setCreatedAt(LocalDateTime.now());

		when(userRepository.existsById(userId)).thenReturn(true);
		when(ticketRepository.findByUser_IdOrderByCreatedAtDesc(userId)).thenReturn(List.of(second, first));

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
		Location location = new Location();
		location.setStreetName("loc");
		location.setLatitude(46.0);
		location.setLongitude(14.0);
		ticket.setLocation(location);
		ticket.setStatus(TicketStatus.COMPLETED);
		ticket.setPriority(TicketPriority.MEDIUM);
		ticket.setServiceType("service");
		ticket.setDescription("desc");

		when(ticketRepository.findById(10L)).thenReturn(Optional.of(ticket));

		assertThrows(InvalidTicketStatusTransitionException.class,
			() -> ticketService.updateTicketStatus(10L, TicketStatus.PENDING_APPROVAL));
	}

	@Test
	void getTicketDetailsShouldThrowWhenMissing() {
		when(ticketRepository.findById(99L)).thenReturn(Optional.empty());
		assertThrows(TicketNotFoundException.class, () -> ticketService.getTicketDetails(99L));
	}

	@Test
	void findNearbyTicketsShouldFilterByRadius() {
		User nearUser = new User();
		nearUser.setId(UUID.randomUUID());
		nearUser.setEmail("near@example.com");
		nearUser.setPassword("secret");
		nearUser.setFirstName("Near");
		nearUser.setLastName("User");
		Location nearLocation = new Location();
		nearLocation.setStreetName("Ljubljana");
		nearLocation.setLatitude(46.0569);
		nearLocation.setLongitude(14.5058);
		nearUser.setLocation(nearLocation);
		Ticket near = new Ticket();
		near.setId(1L);
		near.setUser(nearUser);
		near.setLocation(nearLocation);
		near.setServiceType("near");
		near.setDescription("near desc");
		near.setStatus(TicketStatus.PENDING_APPROVAL);
		near.setPriority(TicketPriority.MEDIUM);

		User farUser = new User();
		farUser.setId(UUID.randomUUID());
		farUser.setEmail("far@example.com");
		farUser.setPassword("secret");
		farUser.setFirstName("Far");
		farUser.setLastName("User");
		Location farLocation = new Location();
		farLocation.setStreetName("Koper");
		farLocation.setLatitude(45.5481);
		farLocation.setLongitude(13.7302);
		farUser.setLocation(farLocation);
		Ticket far = new Ticket();
		far.setId(2L);
		far.setUser(farUser);
		far.setLocation(farLocation);
		far.setServiceType("far");
		far.setDescription("far desc");
		far.setStatus(TicketStatus.PENDING_APPROVAL);
		far.setPriority(TicketPriority.MEDIUM);

		when(ticketRepository.findAllWithCoordinates()).thenReturn(List.of(near, far));

		List<TicketResponse> responses = ticketService.findNearbyTickets(46.0569, 14.5058, 10.0);

		assertEquals(1, responses.size());
		assertEquals(1L, responses.get(0).getId());
	}
}
