package com.example.backend.web.controller;

import com.example.backend.domain.user.User;
import com.example.backend.domain.user.UserRole;
import com.example.backend.domain.user.UserStatus;
import com.example.backend.security.UserPrincipal;
import com.example.backend.service.AdminService;
import com.example.backend.service.TicketService;
import com.example.backend.web.dto.request.ChangeUserRoleRequest;
import com.example.backend.web.dto.request.DeclineProviderRequest;
import com.example.backend.web.dto.response.MessageResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock private AdminService adminService;
    @Mock private TicketService ticketService;

    @InjectMocks
    private AdminController adminController;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private UserPrincipal adminPrincipal;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminController)
            .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
            .build();

        User admin = new User();
        admin.setId(UUID.randomUUID());
        admin.setEmail("admin@test.com");
        admin.setPassword("encoded");
        admin.setRole(UserRole.ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        adminPrincipal = new UserPrincipal(admin);

        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(adminPrincipal, null, adminPrincipal.getAuthorities()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void listPendingProvidersShouldReturn200() throws Exception {
        when(adminService.listPendingProviders()).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/admin/providers/pending"))
            .andExpect(status().isOk());
    }

    @Test
    void listAllProvidersShouldReturn200() throws Exception {
        when(adminService.listAllProviders()).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/admin/providers"))
            .andExpect(status().isOk());
    }

    @Test
    void approveProviderShouldReturn200() throws Exception {
        UUID providerId = UUID.randomUUID();
        when(adminService.approveProvider(eq(providerId), any()))
            .thenReturn(new MessageResponse("Provider approved successfully."));

        mockMvc.perform(post("/api/v1/admin/providers/{id}/approve", providerId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Provider approved successfully."));
    }

    @Test
    void declineProviderShouldReturn200() throws Exception {
        UUID providerId = UUID.randomUUID();
        DeclineProviderRequest req = new DeclineProviderRequest();
        req.setReason("Missing documents");
        when(adminService.declineProvider(eq(providerId), any(), any()))
            .thenReturn(new MessageResponse("Provider declined."));

        mockMvc.perform(post("/api/v1/admin/providers/{id}/decline", providerId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Provider declined."));
    }

    @Test
    void listAllUsersShouldReturn200() throws Exception {
        when(adminService.listAllUsers()).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/admin/users"))
            .andExpect(status().isOk());
    }

    @Test
    void suspendUserShouldReturn200() throws Exception {
        UUID userId = UUID.randomUUID();
        when(adminService.suspendUser(userId)).thenReturn(new MessageResponse("User suspended."));

        mockMvc.perform(post("/api/v1/admin/users/{id}/suspend", userId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("User suspended."));
    }

    @Test
    void reactivateUserShouldReturn200() throws Exception {
        UUID userId = UUID.randomUUID();
        when(adminService.reactivateUser(userId)).thenReturn(new MessageResponse("User reactivated."));

        mockMvc.perform(post("/api/v1/admin/users/{id}/reactivate", userId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("User reactivated."));
    }

    @Test
    void deleteUserShouldReturn200() throws Exception {
        UUID userId = UUID.randomUUID();
        when(adminService.deleteUser(userId)).thenReturn(new MessageResponse("User deleted."));

        mockMvc.perform(delete("/api/v1/admin/users/{id}", userId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("User deleted."));
    }

    @Test
    void restoreUserShouldReturn200() throws Exception {
        UUID userId = UUID.randomUUID();
        when(adminService.restoreUser(userId)).thenReturn(new MessageResponse("User restored."));

        mockMvc.perform(post("/api/v1/admin/users/{id}/restore", userId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("User restored."));
    }

    @Test
    void changeUserRoleShouldReturn200() throws Exception {
        UUID userId = UUID.randomUUID();
        ChangeUserRoleRequest req = new ChangeUserRoleRequest();
        req.setRole(UserRole.ADMIN);
        when(adminService.changeUserRole(eq(userId), eq(UserRole.ADMIN), any()))
            .thenReturn(new MessageResponse("User role updated. The user must sign in again for it to take effect."));

        mockMvc.perform(put("/api/v1/admin/users/{id}/role", userId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("User role updated. The user must sign in again for it to take effect."));
    }
}
