package com.example.backend.dto;

import com.example.backend.domain.chat.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ChatMessageRequest {

    @NotNull
    private UUID senderId;

    @NotNull
    private UUID recipientId;

    @NotNull
    private UUID chatRoomId;

    @NotBlank
    private String content;

    private MessageType type;
}
