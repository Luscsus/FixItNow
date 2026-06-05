package com.example.backend.dto;

import java.util.UUID;

/**
 * Delivered to the offending user's private queue (/user/queue/errors) when a
 * chat message is rejected (rate limit, flood, duplicate, length). The frontend
 * maps {@code code} to a localized message and uses {@code retryAfterSeconds}
 * to disable the send button until messaging is allowed again.
 */
public record ChatErrorResponse(
    String code,
    String message,
    long retryAfterSeconds,
    UUID chatRoomId
) {
}
