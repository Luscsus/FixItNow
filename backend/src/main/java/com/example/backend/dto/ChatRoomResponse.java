package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class ChatRoomResponse {

    private UUID id;
    private Long ticketId;
    private UUID customerId;
    private UUID providerId;
}
