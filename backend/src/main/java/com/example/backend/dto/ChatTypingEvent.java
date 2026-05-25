package com.example.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ChatTypingEvent {

    @NotNull
    private UUID chatRoomId;

    @NotNull
    private UUID userId;

    private boolean typing;
}

