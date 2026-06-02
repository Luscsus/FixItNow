package com.example.backend.web.controller;

import com.example.backend.dto.NotificationResponse;
import com.example.backend.security.UserPrincipal;
import com.example.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<NotificationResponse>> list(@AuthenticationPrincipal UserPrincipal userDetails) {
        return ResponseEntity.ok(notificationService.getNotifications(userDetails.getUser().getId()));
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> unreadCount(@AuthenticationPrincipal UserPrincipal userDetails) {
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(userDetails.getUser().getId())));
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Boolean>> markRead(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal userDetails) {
        notificationService.markAsRead(id, userDetails.getUser().getId());
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Boolean>> markAllRead(@AuthenticationPrincipal UserPrincipal userDetails) {
        notificationService.markAllAsRead(userDetails.getUser().getId());
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Boolean>> deleteAll(@AuthenticationPrincipal UserPrincipal userDetails) {
        notificationService.deleteAll(userDetails.getUser().getId());
        return ResponseEntity.ok(Map.of("success", true));
    }
}
