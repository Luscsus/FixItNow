package com.example.backend.dto;

import com.example.backend.domain.chat.MessageType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class ChatRoomSummaryResponse {

    private UUID id;
    private UUID otherParticipantId;
    private String otherParticipantName;
    private String otherParticipantProfilePictureUrl;

    /** Preview + ordering data for the inbox (null when the room has no messages). */
    private String lastMessageContent;
    private MessageType lastMessageType;
    private LocalDateTime lastMessageTimestamp;

    /** Count of messages addressed to the requesting user that are not yet READ. */
    private long unreadCount;
}
