package com.example.backend.service;

import com.example.backend.domain.notification.Notification;
import com.example.backend.domain.notification.NotificationType;
import com.example.backend.domain.user.User;
import com.example.backend.domain.user.UserRole;
import com.example.backend.dto.NotificationResponse;
import com.example.backend.repository.NotificationRepository;
import com.example.backend.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, String>> PARAMS_TYPE = new TypeReference<>() {};

    // De-dup window: if an identical notification was created within this span,
    // skip creating another (guards against the endpoint being hit twice in
    // quick succession, double-submits, retries, etc.).
    private static final java.time.Duration DEDUP_WINDOW = java.time.Duration.ofMinutes(2);

    @Override
    @Transactional
    public void notifyTicketStatusChange(Long ticketId, UUID recipientId, String title, String body,
                                         String titleKey, String bodyKey, Map<String, String> params) {
        createTicketScoped(NotificationType.TICKET_STATUS_CHANGE, ticketId, recipientId,
            title, body, titleKey, bodyKey, params);
    }

    @Override
    @Transactional
    public void notifyProviderNearby(Long ticketId, UUID recipientId, String title, String body,
                                     String titleKey, String bodyKey, Map<String, String> params) {
        createTicketScoped(NotificationType.PROVIDER_NEARBY, ticketId, recipientId,
            title, body, titleKey, bodyKey, params);
    }

    @Override
    @Transactional
    public void notifyInboundRequest(Long ticketId, UUID recipientId, String title, String body,
                                     String titleKey, String bodyKey, Map<String, String> params) {
        createTicketScoped(NotificationType.INBOUND_REQUEST, ticketId, recipientId,
            title, body, titleKey, bodyKey, params);
    }

    @Override
    @Transactional
    public void notifyPaymentReceived(Long ticketId, UUID recipientId, String title, String body,
                                      String titleKey, String bodyKey, Map<String, String> params) {
        createTicketScoped(NotificationType.PAYMENT_RECEIVED, ticketId, recipientId,
            title, body, titleKey, bodyKey, params);
    }

    @Override
    @Transactional
    public void notifyReviewReceived(UUID recipientId, String title, String body,
                                     String titleKey, String bodyKey, Map<String, String> params) {
        // Reviews aren't tied to a ticket, so no ticketId / dedup window applies.
        createTicketScoped(NotificationType.REVIEW_RECEIVED, null, recipientId,
            title, body, titleKey, bodyKey, params);
    }

    /**
     * Shared create-and-broadcast path for the simple, single-row notification types
     * (everything except the aggregated NEW_MESSAGE). Preference-gated and de-duplicated
     * on the (recipient, type, ticketId, body) tuple within {@link #DEDUP_WINDOW}.
     */
    private void createTicketScoped(NotificationType type, Long ticketId, UUID recipientId,
                                    String title, String body, String titleKey, String bodyKey,
                                    Map<String, String> params) {
        if (recipientId == null || body == null || !isEnabled(recipientId, type)) {
            return;
        }
        if (isRecentDuplicate(recipientId, type, ticketId, body)) {
            return;
        }
        Notification n = new Notification();
        n.setRecipientId(recipientId);
        n.setType(type);
        n.setTitle(title);
        n.setBody(body);
        n.setTitleKey(titleKey);
        n.setBodyKey(bodyKey);
        n.setParamsJson(writeParams(params));
        n.setTicketId(ticketId);
        n.setCreatedAt(LocalDateTime.now());
        broadcast(notificationRepository.save(n));
    }

    private boolean isRecentDuplicate(UUID recipientId, NotificationType type, Long ticketId, String body) {
        if (ticketId == null) return false;
        return notificationRepository.existsRecentDuplicate(
            recipientId, type, ticketId, body, LocalDateTime.now().minus(DEDUP_WINDOW));
    }

    @Override
    @Transactional
    public void notifyNewMessage(UUID recipientId, UUID chatRoomId, Long ticketId, String senderName) {
        if (recipientId == null || chatRoomId == null || !isEnabled(recipientId, NotificationType.NEW_MESSAGE)) {
            return;
        }
        Notification n = notificationRepository
            .findFirstByRecipientIdAndChatRoomIdAndTypeAndReadFalse(recipientId, chatRoomId, NotificationType.NEW_MESSAGE)
            .orElseGet(Notification::new);
        if (n.getId() == null) {
            n.setRecipientId(recipientId);
            n.setType(NotificationType.NEW_MESSAGE);
            n.setChatRoomId(chatRoomId);
            n.setTicketId(ticketId);
            n.setAggregateCount(1);
        } else {
            n.setAggregateCount(n.getAggregateCount() + 1);
        }
        // The title is the sender's name (a proper noun — not translated); when unknown
        // we fall back to a localized "New message". The body count is localized via a
        // pluralized i18next key with the running aggregate count as its param.
        n.setTitle(senderName != null ? senderName : "New message");
        n.setBody(n.getAggregateCount() == 1 ? "Sent you a message" : n.getAggregateCount() + " new messages");
        n.setTitleKey(senderName != null ? null : "notifications.message.titleFallback");
        n.setBodyKey("notifications.message.body");
        n.setParamsJson(writeParams(Map.of("count", String.valueOf(n.getAggregateCount()))));
        n.setCreatedAt(LocalDateTime.now());
        broadcast(notificationRepository.save(n));
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(UUID userId) {
        return notificationRepository.findTop50ByRecipientIdOrderByCreatedAtDesc(userId)
            .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    @Override
    @Transactional
    public void markAsRead(Long id, UUID userId) {
        notificationRepository.findById(id).ifPresent(n -> {
            if (!n.getRecipientId().equals(userId)) {
                throw new AccessDeniedException("Not your notification");
            }
            if (!n.isRead()) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    @Override
    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllReadForRecipient(userId);
    }

    @Override
    @Transactional
    public void deleteAll(UUID userId) {
        notificationRepository.deleteAllForRecipient(userId);
    }

    @Override
    @Transactional
    public void markChatRoomRead(UUID userId, UUID chatRoomId) {
        notificationRepository
            .findFirstByRecipientIdAndChatRoomIdAndTypeAndReadFalse(userId, chatRoomId, NotificationType.NEW_MESSAGE)
            .ifPresent(n -> {
                n.setRead(true);
                broadcast(notificationRepository.save(n));
            });
    }

    private boolean isEnabled(UUID userId, NotificationType type) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return false;
        }
        Map<String, Boolean> prefs = user.getNotificationPreferences();
        boolean isProvider = user.getRole() == UserRole.PROVIDER;
        String key = switch (type) {
            case TICKET_STATUS_CHANGE -> isProvider ? "jobStatusChanges" : "statusChanges";
            case NEW_MESSAGE          -> isProvider ? "customerReplies" : "providerReplies";
            // Proximity alerts are customer-facing and ride along with the
            // customer's status-change preference.
            case PROVIDER_NEARBY      -> "statusChanges";
            // Provider-facing alerts, each gated by its own toggle.
            case INBOUND_REQUEST      -> "inboundRequests";
            case PAYMENT_RECEIVED     -> "paymentReceived";
            case REVIEW_RECEIVED      -> "reviewsReceived";
        };
        return prefs == null || prefs.getOrDefault(key, true);
    }

    private void broadcast(Notification n) {
        // Snapshot the payload now (while the entity is managed), but only push it to the
        // client AFTER the surrounding transaction commits. Sending mid-transaction lets the
        // client receive the frame and refetch before the row is committed/visible, so the
        // new notification is missed and the unread badge never updates. Deferring to
        // afterCommit guarantees the row is readable by the time the frame goes out.
        String destination = "/topic/notifications/" + n.getRecipientId();
        NotificationResponse payload = toResponse(n);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    messagingTemplate.convertAndSend(destination, payload);
                }
            });
        } else {
            messagingTemplate.convertAndSend(destination, payload);
        }
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
            n.getId(),
            n.getType(),
            n.getTitle(),
            n.getBody(),
            n.getTitleKey(),
            n.getBodyKey(),
            readParams(n.getParamsJson()),
            n.getTicketId(),
            n.getChatRoomId(),
            n.getAggregateCount(),
            n.isRead(),
            n.getCreatedAt()
        );
    }

    /** Serialize interpolation params to JSON for storage; null when there's nothing to store. */
    private String writeParams(Map<String, String> params) {
        if (params == null || params.isEmpty()) {
            return null;
        }
        try {
            return OBJECT_MAPPER.writeValueAsString(params);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    /** Parse stored params JSON back into a map; null/blank or malformed yields null. */
    private Map<String, String> readParams(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return OBJECT_MAPPER.readValue(json, PARAMS_TYPE);
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}
