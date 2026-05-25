package com.example.backend.dto;

import com.example.backend.domain.chat.MessageType;
import com.example.backend.domain.chat.MessageStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {

    private Long id;
    private UUID senderId;
    private UUID recipientId;
    private UUID chatRoomId;
    private String content;
    private MessageType type;
    private MessageStatus status;
    private LocalDateTime deliveredAt;
    private LocalDateTime readAt;
    private LocalDateTime timestamp;
}
