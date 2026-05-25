package com.example.backend.dto;

import com.example.backend.domain.chat.MessageStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ChatMessageStatusRequest {

    @NotNull
    private UUID chatRoomId;

    @NotNull
    private Long messageId;

    @NotNull
    private UUID userId;

    @NotNull
    private MessageStatus status;
}

