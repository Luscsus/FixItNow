package com.example.backend.domain.chat;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_message", indexes = {
        @Index(name = "idx_chat_room_timestamp", columnList = "chat_room_id, timestamp")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sender_id", nullable = false)
    private UUID senderId;

    @Column(name = "recipient_id", nullable = false)
    private UUID recipientId;

    @Column(name = "chat_room_id", nullable = false)
    private UUID chatRoomId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false, length = 10)
    private MessageType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_status", nullable = false, length = 10)
    private MessageStatus status;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    public ChatMessage() {}

    public ChatMessage(Long id, UUID senderId, UUID recipientId, UUID chatRoomId, String content, MessageType type,
                       MessageStatus status, LocalDateTime timestamp) {
        this.id = id;
        this.senderId = senderId;
        this.recipientId = recipientId;
        this.chatRoomId = chatRoomId;
        this.content = content;
        this.type = type;
        this.status = status;
        this.timestamp = timestamp;
    }

}
