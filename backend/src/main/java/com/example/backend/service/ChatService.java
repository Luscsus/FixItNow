package com.example.backend.service;

import com.example.backend.dto.ChatMessageRequest;
import com.example.backend.dto.ChatMessageResponse;
import com.example.backend.dto.ChatRoomResponse;
import com.example.backend.dto.ChatRoomSummaryResponse;
import com.example.backend.domain.chat.MessageStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ChatService {

    ChatMessageResponse saveMessage(ChatMessageRequest request);

    List<ChatMessageResponse> getMessages(UUID chatRoomId, UUID userId, LocalDateTime before, int page, int size);

    ChatMessageResponse updateStatus(Long messageId, UUID chatRoomId, UUID userId, MessageStatus status);

    List<UUID> getUserChatRooms(UUID userId);

    List<ChatRoomSummaryResponse> getUserChatRoomSummaries(UUID userId);

    void assertParticipant(UUID chatRoomId, UUID userId);

    void assertParticipants(UUID chatRoomId, UUID senderId, UUID recipientId);

    ChatRoomResponse getChatRoom(UUID chatRoomId, UUID userId);

    /**
     * Persists a SYSTEM-type message for the given room and broadcasts it to all
     * connected participants. Used for ticket lifecycle events (accept, en-route, etc.).
     */
    ChatMessageResponse saveSystemMessage(UUID chatRoomId, String content);
}
