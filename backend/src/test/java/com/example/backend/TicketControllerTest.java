package com.example.backend;

import com.example.backend.web.controller.TicketController;
import com.example.backend.domain.ticket.TicketPriority;
import com.example.backend.domain.ticket.TicketStatus;
import com.example.backend.domain.user.ServiceCategory;
import com.example.backend.domain.user.User;
import com.example.backend.dto.CreateTicketRequest;
import com.example.backend.dto.TicketResponse;
import com.example.backend.security.UserPrincipal;
import com.example.backend.service.TicketService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class TicketControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private TicketService ticketService;

    @BeforeEach
    void setUp() {
        ticketService = mock(TicketService.class);
        TicketController controller = new TicketController(ticketService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
            .build();
        objectMapper = new ObjectMapper();
        SecurityContextHolder.clearContext();
    }

    private UserPrincipal authenticatedPrincipal() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("user@example.com");
        user.setPassword("secret");
        user.setFirstName("Test");
        user.setLastName("User");

        UserPrincipal principal = mock(UserPrincipal.class);
        when(principal.getUser()).thenReturn(user);
        when(principal.getUsername()).thenReturn(user.getEmail());
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(principal, null)
        );
        return principal;
    }

    @Test
    void createTicketEndpointShouldReturnCreatedTicket() throws Exception {
        UserPrincipal principal = authenticatedPrincipal();
        UUID userId = principal.getUser().getId();

        CreateTicketRequest request = new CreateTicketRequest();
        request.setServiceType("pušča pipa");
        request.setCategory(ServiceCategory.PLUMBING);
        request.setDescription("Pipa pušča v kuhinji");
        request.setLocation("Ljubljana");
        request.setLatitude(46.0569);
        request.setLongitude(14.5058);
        request.setPriority(TicketPriority.CRITICAL);

        TicketResponse response = new TicketResponse(
            1L,
            request.getServiceType(),
            ServiceCategory.PLUMBING,
            request.getDescription(),
            request.getLocation(),
            TicketStatus.PENDING_APPROVAL,
            TicketPriority.CRITICAL,
            new BigDecimal("49.99"),
            LocalDateTime.now(),
            null,
            null,
            null
        );
        when(ticketService.createTicket(any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/tickets")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.serviceType").value("pušča pipa"))
            .andExpect(jsonPath("$.status").value("PENDING_APPROVAL"))
            .andExpect(jsonPath("$.priority").value("CRITICAL"));

        verify(ticketService).createTicket(any(), eq(userId));
    }

    @Test
    void getUserTicketsEndpointShouldReturnList() throws Exception {
        UserPrincipal principal = authenticatedPrincipal();
        UUID userId = principal.getUser().getId();

        TicketResponse response = new TicketResponse(
            2L,
            "elektrika",
            ServiceCategory.ELECTRICAL,
            "Stikalo ne deluje",
            "Maribor",
            TicketStatus.IN_TRANSIT,
            TicketPriority.MEDIUM,
            null,
            LocalDateTime.now(),
            "Elektro Servis",
            null,
            null
        );
        when(ticketService.getUserTickets(any())).thenReturn(List.of(response));

        mockMvc.perform(get("/api/tickets"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(2))
            .andExpect(jsonPath("$[0].assignedServiceProviderName").value("Elektro Servis"));

        verify(ticketService).getUserTickets(eq(userId));
    }

    @Test
    void getTicketDetailsEndpointShouldReturnTicket() throws Exception {
        TicketResponse response = new TicketResponse(
            3L,
            "vodovod",
            ServiceCategory.PLUMBING,
            "Nujno popravilo",
            "Celje",
            TicketStatus.PENDING_APPROVAL,
            TicketPriority.HIGH,
            null,
            LocalDateTime.now(),
            null,
            null,
            null
        );
        when(ticketService.getTicketDetails(3L)).thenReturn(response);

        mockMvc.perform(get("/api/tickets/3"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(3))
            .andExpect(jsonPath("$.location").value("Celje"));

        verify(ticketService).getTicketDetails(3L);
    }

    @Test
    void updateTicketStatusEndpointShouldReturnUpdatedTicket() throws Exception {
        TicketResponse response = new TicketResponse(
            4L,
            "ključavnica",
            ServiceCategory.LOCKSMITH,
            "Zamenjava ključavnice",
            "Kranj",
            TicketStatus.IN_TRANSIT,
            TicketPriority.MEDIUM,
            null,
            LocalDateTime.now(),
            null,
            null,
            null
        );
        when(ticketService.updateTicketStatus(4L, TicketStatus.IN_TRANSIT)).thenReturn(response);

        mockMvc.perform(put("/api/tickets/4/status")
                .param("newStatus", "IN_TRANSIT"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("IN_TRANSIT"));

        verify(ticketService).updateTicketStatus(4L, TicketStatus.IN_TRANSIT);
    }

    @Test
    void nearbyTicketsEndpointShouldReturnNearbyTickets() throws Exception {
        TicketResponse response = new TicketResponse(
            5L,
            "streha",
            ServiceCategory.ROOFING,
            "Zamenjava strešne kritine",
            "Novo mesto",
            TicketStatus.PENDING_APPROVAL,
            TicketPriority.HIGH,
            null,
            LocalDateTime.now(),
            null,
            null,
            null
        );
        when(ticketService.findNearbyTickets(anyDouble(), anyDouble(), anyDouble())).thenReturn(List.of(response));

        mockMvc.perform(get("/api/tickets/nearby")
                .param("latitude", "46.0")
                .param("longitude", "14.5"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(5));

        verify(ticketService).findNearbyTickets(46.0, 14.5, 5.0);
    }
}
