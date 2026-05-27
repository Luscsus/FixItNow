package com.example.backend.dto;

import com.example.backend.domain.notification.NotificationType;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponse(
    Long id,
    NotificationType type,
    String title,
    String body,
    Long ticketId,
    UUID chatRoomId,
    int aggregateCount,
    boolean read,
    LocalDateTime createdAt
) {}
