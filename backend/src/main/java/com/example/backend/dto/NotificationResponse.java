package com.example.backend.dto;

import com.example.backend.domain.notification.NotificationType;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

public record NotificationResponse(
    Long id,
    NotificationType type,
    String title,
    String body,
    String titleKey,
    String bodyKey,
    Map<String, String> params,
    Long ticketId,
    UUID chatRoomId,
    int aggregateCount,
    boolean read,
    LocalDateTime createdAt
) {}
