package com.example.backend;

import com.example.backend.domain.chat.ChatMessage;
import com.example.backend.domain.chat.MessageType;
import com.example.backend.dto.ChatMessageRequest;
import com.example.backend.dto.ChatMessageResponse;
import com.example.backend.repository.ChatRepository;
import com.example.backend.repository.ChatRoomRepository;
import com.example.backend.service.ChatServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private ChatRepository chatRepository;

    @Mock
    private ChatRoomRepository chatRoomRepository;

    @InjectMocks
    private ChatServiceImpl chatService;

    @Test
    void saveMessageShouldPersistAndDefaultType() {
        UUID senderId = UUID.randomUUID();
        UUID chatRoomId = UUID.randomUUID();
        UUID recipientId = UUID.randomUUID();

        ChatMessageRequest request = new ChatMessageRequest();
        request.setSenderId(senderId);
        request.setRecipientId(recipientId);
        request.setChatRoomId(chatRoomId);
        request.setContent("Hello");
        request.setType(null);

        ChatMessage saved = new ChatMessage();
        saved.setId(10L);
        saved.setSenderId(senderId);
        saved.setRecipientId(recipientId);
        saved.setChatRoomId(chatRoomId);
        saved.setContent("Hello");
        saved.setType(MessageType.TEXT);
        saved.setStatus(com.example.backend.domain.chat.MessageStatus.SENT);
        saved.setTimestamp(LocalDateTime.now());

        when(chatRoomRepository.isParticipant(chatRoomId, senderId)).thenReturn(true);
        when(chatRoomRepository.isParticipant(chatRoomId, recipientId)).thenReturn(true);

        when(chatRepository.save(any(ChatMessage.class))).thenReturn(saved);

        ChatMessageResponse response = chatService.saveMessage(request);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals(senderId, response.getSenderId());
        assertEquals(chatRoomId, response.getChatRoomId());
        assertEquals(recipientId, response.getRecipientId());
        assertEquals(MessageType.TEXT, response.getType());
    }
}
