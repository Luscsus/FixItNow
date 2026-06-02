package com.example.backend.service;

import com.example.backend.domain.notification.Notification;
import com.example.backend.domain.notification.NotificationType;
import com.example.backend.domain.user.User;
import com.example.backend.domain.user.UserRole;
import com.example.backend.dto.NotificationResponse;
import com.example.backend.repository.NotificationRepository;
import com.example.backend.repository.UserRepository;
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

    // De-dup window: if an identical notification was created within this span,
    // skip creating another (guards against the endpoint being hit twice in
    // quick succession, double-submits, retries, etc.).
    private static final java.time.Duration DEDUP_WINDOW = java.time.Duration.ofMinutes(2);

    @Override
    @Transactional
    public void notifyTicketStatusChange(Long ticketId, UUID recipientId, String title, String body) {
        if (recipientId == null || body == null || !isEnabled(recipientId, NotificationType.TICKET_STATUS_CHANGE)) {
            return;
        }
        if (isRecentDuplicate(recipientId, NotificationType.TICKET_STATUS_CHANGE, ticketId, body)) {
            return;
        }
        Notification n = new Notification();
        n.setRecipientId(recipientId);
        n.setType(NotificationType.TICKET_STATUS_CHANGE);
        n.setTitle(title);
        n.setBody(body);
        n.setTicketId(ticketId);
        n.setCreatedAt(LocalDateTime.now());
        broadcast(notificationRepository.save(n));
    }

    @Override
    @Transactional
    public void notifyProviderNearby(Long ticketId, UUID recipientId, String title, String body) {
        if (recipientId == null || body == null || !isEnabled(recipientId, NotificationType.PROVIDER_NEARBY)) {
            return;
        }
        if (isRecentDuplicate(recipientId, NotificationType.PROVIDER_NEARBY, ticketId, body)) {
            return;
        }
        Notification n = new Notification();
        n.setRecipientId(recipientId);
        n.setType(NotificationType.PROVIDER_NEARBY);
        n.setTitle(title);
        n.setBody(body);
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
        n.setTitle(senderName != null ? senderName : "New message");
        n.setBody(n.getAggregateCount() == 1 ? "Sent you a message" : n.getAggregateCount() + " new messages");
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
            n.getTicketId(),
            n.getChatRoomId(),
            n.getAggregateCount(),
            n.isRead(),
            n.getCreatedAt()
        );
    }
}
