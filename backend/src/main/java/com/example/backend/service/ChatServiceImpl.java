package com.example.backend.service;

import com.example.backend.domain.chat.ChatMessage;
import com.example.backend.domain.chat.ChatRoom;
import com.example.backend.domain.chat.MessageType;
import com.example.backend.domain.chat.MessageStatus;
import com.example.backend.dto.ChatMessageRequest;
import com.example.backend.dto.ChatMessageResponse;
import com.example.backend.dto.ChatRoomResponse;
import com.example.backend.repository.ChatRepository;
import com.example.backend.repository.ChatRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatRepository chatRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public ChatMessageResponse saveMessage(ChatMessageRequest request) {
        assertParticipants(request.getChatRoomId(), request.getSenderId(), request.getRecipientId());
        ChatMessage message = new ChatMessage();
        message.setSenderId(request.getSenderId());
        message.setRecipientId(request.getRecipientId());
        message.setChatRoomId(request.getChatRoomId());
        message.setContent(request.getContent());
        message.setType(request.getType() != null ? request.getType() : MessageType.TEXT);
        message.setStatus(MessageStatus.SENT);
        message.setTimestamp(LocalDateTime.now());

        ChatMessage saved = chatRepository.save(message);
        return toResponse(saved);
    }

    @Override
    public List<ChatMessageResponse> getMessages(UUID chatRoomId, UUID userId, LocalDateTime before, int page, int size) {
        assertParticipant(chatRoomId, userId);
        Slice<ChatMessage> slice = before == null
            ? chatRepository.findByChatRoomIdOrderByTimestampDesc(chatRoomId, PageRequest.of(page, size))
            : chatRepository.findByChatRoomIdAndTimestampBeforeOrderByTimestampDesc(
                chatRoomId,
                before,
                PageRequest.of(page, size)
            );
        return slice.getContent().stream().map(this::toResponse).toList();
    }

    @Override
    public ChatMessageResponse updateStatus(Long messageId, UUID chatRoomId, UUID userId, MessageStatus status) {
        assertParticipant(chatRoomId, userId);
        ChatMessage message = chatRepository.findById(messageId)
            .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        if (!chatRoomId.equals(message.getChatRoomId())) {
            throw new IllegalArgumentException("Message does not belong to chat room");
        }
        if (!userId.equals(message.getRecipientId())) {
            throw new IllegalArgumentException("Only recipient can update status");
        }
        if (status == MessageStatus.DELIVERED && message.getDeliveredAt() == null) {
            message.setDeliveredAt(LocalDateTime.now());
        }
        if (status == MessageStatus.READ) {
            if (message.getDeliveredAt() == null) {
                message.setDeliveredAt(LocalDateTime.now());
            }
            message.setReadAt(LocalDateTime.now());
        }
        message.setStatus(status);

        ChatMessage saved = chatRepository.save(message);
        return toResponse(saved);
    }

    @Override
    public List<UUID> getUserChatRooms(UUID userId) {
        return chatRoomRepository.findRoomIdsForUser(userId);
    }

    @Override
    public void assertParticipant(UUID chatRoomId, UUID userId) {
        if (!chatRoomRepository.isParticipant(chatRoomId, userId)) {
            throw new IllegalArgumentException("User is not a participant of this chat room");
        }
    }

    @Override
    public void assertParticipants(UUID chatRoomId, UUID senderId, UUID recipientId) {
        if (!chatRoomRepository.isParticipant(chatRoomId, senderId)
            || !chatRoomRepository.isParticipant(chatRoomId, recipientId)) {
            throw new IllegalArgumentException("Sender or recipient is not a participant of this chat room");
        }
    }

    @Override
    public ChatMessageResponse saveSystemMessage(UUID chatRoomId, String content) {
        ChatRoom room = chatRoomRepository.findById(chatRoomId)
            .orElseThrow(() -> new IllegalArgumentException("Chat room not found: " + chatRoomId));

        ChatMessage message = new ChatMessage();
        // SYSTEM messages aren't authored by a participant — but the column is NOT NULL,
        // so we record the room participants for FK / data-integrity. The frontend
        // ignores sender/recipient on SYSTEM messages and renders them centred.
        message.setSenderId(room.getCustomerId());
        message.setRecipientId(room.getProviderId());
        message.setChatRoomId(chatRoomId);
        message.setContent(content);
        message.setType(MessageType.SYSTEM);
        message.setStatus(MessageStatus.SENT);
        message.setTimestamp(LocalDateTime.now());

        ChatMessage saved = chatRepository.save(message);
        ChatMessageResponse response = toResponse(saved);
        messagingTemplate.convertAndSend("/topic/chat/" + chatRoomId, response);
        return response;
    }

    @Override
    public ChatRoomResponse getChatRoom(UUID chatRoomId, UUID userId) {
        assertParticipant(chatRoomId, userId);
        ChatRoom room = chatRoomRepository.findById(chatRoomId)
            .orElseThrow(() -> new IllegalArgumentException("Chat room not found"));
        return new ChatRoomResponse(room.getId(), room.getTicketId(), room.getCustomerId(), room.getProviderId());
    }

    private ChatMessageResponse toResponse(ChatMessage message) {
        return new ChatMessageResponse(
            message.getId(),
            message.getSenderId(),
            message.getRecipientId(),
            message.getChatRoomId(),
            message.getContent(),
            message.getType(),
            message.getStatus(),
            message.getDeliveredAt(),
            message.getReadAt(),
            message.getTimestamp()
        );
    }
}
