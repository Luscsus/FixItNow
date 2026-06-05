package com.example.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/** WS payload to edit (content) or delete a message. {@code content} is unused for delete. */
@Getter
@Setter
public class ChatMessageEditRequest {

    @NotNull
    private UUID chatRoomId;

    @NotNull
    private Long messageId;

    @NotNull
    private UUID userId;

    /** Required for edits (validated in the service); ignored for deletes. */
    private String content;
}
