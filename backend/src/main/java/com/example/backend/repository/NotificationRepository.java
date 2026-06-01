package com.example.backend.repository;

import com.example.backend.domain.notification.Notification;
import com.example.backend.domain.notification.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop50ByRecipientIdOrderByCreatedAtDesc(UUID recipientId);

    long countByRecipientIdAndReadFalse(UUID recipientId);

    Optional<Notification> findFirstByRecipientIdAndChatRoomIdAndTypeAndReadFalse(
        UUID recipientId, UUID chatRoomId, NotificationType type);

    /**
     * True if an identical notification (same recipient, ticket, type, body)
     * was already created at/after {@code since}. Suppresses duplicate rows
     * when a status endpoint is hit more than once in quick succession.
     */
    @Query("""
        SELECT (COUNT(n) > 0) FROM Notification n
        WHERE n.recipientId = :recipientId
          AND n.type = :type
          AND n.ticketId = :ticketId
          AND n.body = :body
          AND n.createdAt >= :since
    """)
    boolean existsRecentDuplicate(
        @Param("recipientId") UUID recipientId,
        @Param("type") NotificationType type,
        @Param("ticketId") Long ticketId,
        @Param("body") String body,
        @Param("since") LocalDateTime since);

    @Modifying
    @Query("update Notification n set n.read = true where n.recipientId = :recipientId and n.read = false")
    void markAllReadForRecipient(@Param("recipientId") UUID recipientId);
}
