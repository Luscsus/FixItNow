package com.example.backend.service;

import com.example.backend.dto.NotificationResponse;

import java.util.List;
import java.util.UUID;

public interface NotificationService {

    /** Create + push a ticket status-change notification (preference-gated). */
    void notifyTicketStatusChange(Long ticketId, UUID recipientId, String title, String body);

    /**
     * Create or bump the per-chat unread-message notification for the recipient
     * (preference-gated). One notification per chat room; repeat messages increment it.
     */
    void notifyNewMessage(UUID recipientId, UUID chatRoomId, Long ticketId, String senderName);

    List<NotificationResponse> getNotifications(UUID userId);

    long getUnreadCount(UUID userId);

    void markAsRead(Long id, UUID userId);

    void markAllAsRead(UUID userId);

    /** Clears the grouped unread-message notification once the recipient reads the chat. */
    void markChatRoomRead(UUID userId, UUID chatRoomId);
}
