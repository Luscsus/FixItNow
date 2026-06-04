package com.example.backend.exception;

import java.util.UUID;

/**
 * Thrown when a chat message is rejected by anti-spam / rate-limiting rules.
 * Handled in the chat WebSocket controller and relayed to the sender's private
 * error queue — it never drops the WebSocket connection.
 */
public class ChatMessageRejectedException extends RuntimeException {

    private final String code;
    private final long retryAfterSeconds;
    private final UUID chatRoomId;

    public ChatMessageRejectedException(String code, String message, long retryAfterSeconds, UUID chatRoomId) {
        super(message);
        this.code = code;
        this.retryAfterSeconds = retryAfterSeconds;
        this.chatRoomId = chatRoomId;
    }

    public String getCode() { return code; }
    public long getRetryAfterSeconds() { return retryAfterSeconds; }
    public UUID getChatRoomId() { return chatRoomId; }
}
