package com.example.backend.repository;

import com.example.backend.domain.notification.Notification;
import com.example.backend.domain.notification.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop50ByRecipientIdOrderByCreatedAtDesc(UUID recipientId);

    long countByRecipientIdAndReadFalse(UUID recipientId);

    Optional<Notification> findFirstByRecipientIdAndChatRoomIdAndTypeAndReadFalse(
        UUID recipientId, UUID chatRoomId, NotificationType type);

    @Modifying
    @Query("update Notification n set n.read = true where n.recipientId = :recipientId and n.read = false")
    void markAllReadForRecipient(@Param("recipientId") UUID recipientId);
}
