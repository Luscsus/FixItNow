package com.example.backend.web.controller;

import com.example.backend.domain.notification.NotificationType;
import com.example.backend.domain.user.User;
import com.example.backend.domain.user.UserRole;
import com.example.backend.domain.user.UserStatus;
import com.example.backend.dto.NotificationResponse;
import com.example.backend.security.UserPrincipal;
import com.example.backend.service.NotificationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock private NotificationService notificationService;

    @InjectMocks
    private NotificationController notificationController;

    private MockMvc mockMvc;
    private UserPrincipal principal;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(notificationController)
            .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
            .build();

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("user@test.com");
        user.setPassword("encoded");
        user.setRole(UserRole.CUSTOMER);
        user.setStatus(UserStatus.ACTIVE);
        principal = new UserPrincipal(user);

        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void listNotificationsShouldReturn200() throws Exception {
        NotificationResponse notif = new NotificationResponse(
            1L,
            NotificationType.TICKET_STATUS_CHANGE,
            "Status changed",
            "Your ticket was updated",
            null, null, null, null, null,
            1,
            false,
            LocalDateTime.now()
        );
        when(notificationService.getNotifications(principal.getUser().getId())).thenReturn(List.of(notif));

        mockMvc.perform(get("/api/notifications"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].title").value("Status changed"));
    }

    @Test
    void unreadCountShouldReturn200WithCount() throws Exception {
        when(notificationService.getUnreadCount(principal.getUser().getId())).thenReturn(5L);

        mockMvc.perform(get("/api/notifications/unread-count"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.count").value(5));
    }

    @Test
    void markOneReadShouldReturn200() throws Exception {
        Long notifId = 42L;
        doNothing().when(notificationService).markAsRead(notifId, principal.getUser().getId());

        mockMvc.perform(put("/api/notifications/{id}/read", notifId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void markAllReadShouldReturn200() throws Exception {
        doNothing().when(notificationService).markAllAsRead(principal.getUser().getId());

        mockMvc.perform(put("/api/notifications/read-all"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void deleteAllNotificationsShouldReturn200() throws Exception {
        doNothing().when(notificationService).deleteAll(principal.getUser().getId());

        mockMvc.perform(delete("/api/notifications"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }
}
