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

    @Override
    @Transactional
    public void notifyTicketStatusChange(Long ticketId, UUID recipientId, String title, String body) {
        if (recipientId == null || body == null || !isEnabled(recipientId, NotificationType.TICKET_STATUS_CHANGE)) {
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
        };
        return prefs == null || prefs.getOrDefault(key, true);
    }

    private void broadcast(Notification n) {
        messagingTemplate.convertAndSend("/topic/notifications/" + n.getRecipientId(), toResponse(n));
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
