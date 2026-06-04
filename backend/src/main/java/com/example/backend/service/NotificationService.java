package com.example.backend.service;

import com.example.backend.dto.NotificationResponse;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface NotificationService {

    /**
     * Create + push a ticket status-change notification (preference-gated).
     * {@code title}/{@code body} are the English fallback; {@code titleKey}/{@code bodyKey}
     * are i18next keys and {@code params} their interpolation values, used by the client
     * to render in the user's language.
     */
    void notifyTicketStatusChange(Long ticketId, UUID recipientId, String title, String body,
                                  String titleKey, String bodyKey, Map<String, String> params);

    /** Create + push a "provider is nearby" notification (preference-gated). See above for the key params. */
    void notifyProviderNearby(Long ticketId, UUID recipientId, String title, String body,
                              String titleKey, String bodyKey, Map<String, String> params);

    /**
     * Create or bump the per-chat unread-message notification for the recipient
     * (preference-gated). One notification per chat room; repeat messages increment it.
     */
    void notifyNewMessage(UUID recipientId, UUID chatRoomId, Long ticketId, String senderName);

    List<NotificationResponse> getNotifications(UUID userId);

    long getUnreadCount(UUID userId);

    void markAsRead(Long id, UUID userId);

    void markAllAsRead(UUID userId);

    /** Permanently removes every notification belonging to the user. */
    void deleteAll(UUID userId);

    /** Clears the grouped unread-message notification once the recipient reads the chat. */
    void markChatRoomRead(UUID userId, UUID chatRoomId);
}
