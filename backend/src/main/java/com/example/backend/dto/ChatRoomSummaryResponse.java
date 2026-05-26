package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class ChatRoomSummaryResponse {

    private UUID id;
    private UUID otherParticipantId;
    private String otherParticipantName;
    private String otherParticipantProfilePictureUrl;
}
