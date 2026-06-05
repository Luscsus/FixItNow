package com.example.backend;

import com.example.backend.domain.chat.ChatMessage;
import com.example.backend.domain.chat.ChatRoom;
import com.example.backend.domain.chat.MessageStatus;
import com.example.backend.domain.chat.MessageType;
import com.example.backend.dto.ChatMessageRequest;
import com.example.backend.dto.ChatMessageResponse;
import com.example.backend.repository.ChatRepository;
import com.example.backend.repository.ChatRoomRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.ChatServiceImpl;
import com.example.backend.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock private ChatRepository chatRepository;
    @Mock private ChatRoomRepository chatRoomRepository;
    @Mock private UserRepository userRepository;
    @Mock private SimpMessagingTemplate messagingTemplate;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private ChatServiceImpl chatService;

    // ── helpers ──────────────────────────────────────────────────────────────

    private ChatRoom buildRoom(UUID customerId, UUID providerId) {
        ChatRoom room = new ChatRoom();
        room.setId(UUID.randomUUID());
        room.setCustomerId(customerId);
        room.setProviderId(providerId);
        room.setTicketId(1L);
        return room;
    }

    private ChatMessage buildMessage(UUID senderId, UUID recipientId, UUID roomId) {
        ChatMessage msg = new ChatMessage();
        msg.setId(1L);
        msg.setSenderId(senderId);
        msg.setRecipientId(recipientId);
        msg.setChatRoomId(roomId);
        msg.setContent("Hello!");
        msg.setType(MessageType.TEXT);
        msg.setStatus(MessageStatus.SENT);
        msg.setTimestamp(LocalDateTime.now());
        return msg;
    }

    // ── saveMessage ──────────────────────────────────────────────────────────

    @Test
    void saveMessageShouldPersistAndDefaultType() {
        UUID senderId = UUID.randomUUID();
        UUID recipientId = UUID.randomUUID();
        UUID roomId = UUID.randomUUID();

        ChatRoom room = buildRoom(senderId, recipientId);
        room.setId(roomId);

        ChatMessageRequest request = new ChatMessageRequest();
        request.setSenderId(senderId);
        request.setRecipientId(recipientId);
        request.setChatRoomId(roomId);
        request.setContent("Hello");
        request.setType(null);

        ChatMessage saved = new ChatMessage();
        saved.setId(10L);
        saved.setSenderId(senderId);
        saved.setRecipientId(recipientId);
        saved.setChatRoomId(roomId);
        saved.setContent("Hello");
        saved.setType(MessageType.TEXT);
        saved.setStatus(MessageStatus.SENT);
        saved.setTimestamp(LocalDateTime.now());

        when(chatRoomRepository.isParticipant(roomId, senderId)).thenReturn(true);
        when(chatRoomRepository.isParticipant(roomId, recipientId)).thenReturn(true);
        when(chatRoomRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(chatRepository.save(any(ChatMessage.class))).thenReturn(saved);
        when(userRepository.findById(senderId)).thenReturn(Optional.empty());
        doNothing().when(notificationService).notifyNewMessage(any(), any(), any(), any());

        ChatMessageResponse response = chatService.saveMessage(request);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals(senderId, response.getSenderId());
        assertEquals(roomId, response.getChatRoomId());
        assertEquals(recipientId, response.getRecipientId());
        assertEquals(MessageType.TEXT, response.getType());
        verify(chatRepository).save(any(ChatMessage.class));
    }

    @Test
    void saveMessageShouldUnhideRoomForBothParticipants() {
        UUID senderId = UUID.randomUUID();
        UUID recipientId = UUID.randomUUID();
        UUID roomId = UUID.randomUUID();

        ChatRoom room = buildRoom(senderId, recipientId);
        room.setId(roomId);
        room.setHiddenForCustomer(true);
        room.setHiddenForProvider(true);

        ChatMessageRequest request = new ChatMessageRequest();
        request.setSenderId(senderId);
        request.setRecipientId(recipientId);
        request.setChatRoomId(roomId);
        request.setContent("Hey!");

        ChatMessage savedMsg = buildMessage(senderId, recipientId, roomId);

        when(chatRoomRepository.isParticipant(roomId, senderId)).thenReturn(true);
        when(chatRoomRepository.isParticipant(roomId, recipientId)).thenReturn(true);
        when(chatRoomRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(chatRepository.save(any(ChatMessage.class))).thenReturn(savedMsg);
        when(userRepository.findById(senderId)).thenReturn(Optional.empty());
        doNothing().when(notificationService).notifyNewMessage(any(), any(), any(), any());

        chatService.saveMessage(request);

        assertFalse(room.isHiddenForCustomer());
        assertFalse(room.isHiddenForProvider());
        verify(chatRoomRepository).save(room);
    }

    @Test
    void saveMessageShouldNotSendNotificationForSystemMessages() {
        UUID senderId = UUID.randomUUID();
        UUID recipientId = UUID.randomUUID();
        UUID roomId = UUID.randomUUID();

        ChatRoom room = buildRoom(senderId, recipientId);
        room.setId(roomId);

        ChatMessageRequest request = new ChatMessageRequest();
        request.setSenderId(senderId);
        request.setRecipientId(recipientId);
        request.setChatRoomId(roomId);
        request.setContent("Ticket accepted.");
        request.setType(MessageType.SYSTEM);

        ChatMessage savedMsg = buildMessage(senderId, recipientId, roomId);
        savedMsg.setType(MessageType.SYSTEM);

        when(chatRoomRepository.isParticipant(roomId, senderId)).thenReturn(true);
        when(chatRoomRepository.isParticipant(roomId, recipientId)).thenReturn(true);
        when(chatRoomRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(chatRepository.save(any(ChatMessage.class))).thenReturn(savedMsg);

        chatService.saveMessage(request);

        verify(notificationService, never()).notifyNewMessage(any(), any(), any(), any());
    }

    @Test
    void saveMessageShouldThrowWhenSenderNotParticipant() {
        UUID senderId = UUID.randomUUID();
        UUID recipientId = UUID.randomUUID();
        UUID roomId = UUID.randomUUID();

        when(chatRoomRepository.isParticipant(roomId, senderId)).thenReturn(false);

        ChatMessageRequest request = new ChatMessageRequest();
        request.setSenderId(senderId);
        request.setRecipientId(recipientId);
        request.setChatRoomId(roomId);
        request.setContent("Hello!");

        assertThrows(IllegalArgumentException.class, () -> chatService.saveMessage(request));
    }

    // ── editMessage ──────────────────────────────────────────────────────────

    @Test
    void editMessageShouldUpdateContent() {
        UUID senderId = UUID.randomUUID();
        UUID roomId = UUID.randomUUID();
        ChatMessage msg = buildMessage(senderId, UUID.randomUUID(), roomId);

        when(chatRepository.findById(1L)).thenReturn(Optional.of(msg));
        when(chatRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ChatMessageResponse resp = chatService.editMessage(1L, senderId, "Updated content");

        assertEquals("Updated content", resp.getContent());
        assertNotNull(msg.getEditedAt());
    }

    @Test
    void editMessageShouldThrowWhenNotSender() {
        UUID senderId = UUID.randomUUID();
        UUID otherId = UUID.randomUUID();
        ChatMessage msg = buildMessage(senderId, otherId, UUID.randomUUID());

        when(chatRepository.findById(1L)).thenReturn(Optional.of(msg));

        assertThrows(AccessDeniedException.class,
            () -> chatService.editMessage(1L, otherId, "Hack!"));
    }

    @Test
    void editMessageShouldThrowForDeletedMessage() {
        UUID senderId = UUID.randomUUID();
        ChatMessage msg = buildMessage(senderId, UUID.randomUUID(), UUID.randomUUID());
        msg.setDeleted(true);

        when(chatRepository.findById(1L)).thenReturn(Optional.of(msg));

        assertThrows(IllegalArgumentException.class,
            () -> chatService.editMessage(1L, senderId, "New content"));
    }

    @Test
    void editMessageShouldThrowForNonTextMessage() {
        UUID senderId = UUID.randomUUID();
        ChatMessage msg = buildMessage(senderId, UUID.randomUUID(), UUID.randomUUID());
        msg.setType(MessageType.SYSTEM);

        when(chatRepository.findById(1L)).thenReturn(Optional.of(msg));

        assertThrows(IllegalArgumentException.class,
            () -> chatService.editMessage(1L, senderId, "New content"));
    }

    @Test
    void editMessageShouldThrowForBlankContent() {
        UUID senderId = UUID.randomUUID();
        ChatMessage msg = buildMessage(senderId, UUID.randomUUID(), UUID.randomUUID());

        when(chatRepository.findById(1L)).thenReturn(Optional.of(msg));

        assertThrows(IllegalArgumentException.class,
            () -> chatService.editMessage(1L, senderId, "   "));
    }

    // ── deleteMessage ────────────────────────────────────────────────────────

    @Test
    void deleteMessageShouldMarkDeleted() {
        UUID senderId = UUID.randomUUID();
        ChatMessage msg = buildMessage(senderId, UUID.randomUUID(), UUID.randomUUID());

        when(chatRepository.findById(1L)).thenReturn(Optional.of(msg));
        when(chatRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        chatService.deleteMessage(1L, senderId);

        assertTrue(msg.isDeleted());
    }

    @Test
    void deleteMessageShouldThrowWhenNotSender() {
        UUID senderId = UUID.randomUUID();
        UUID otherId = UUID.randomUUID();
        ChatMessage msg = buildMessage(senderId, otherId, UUID.randomUUID());

        when(chatRepository.findById(1L)).thenReturn(Optional.of(msg));

        assertThrows(AccessDeniedException.class,
            () -> chatService.deleteMessage(1L, otherId));
    }

    // ── updateStatus ─────────────────────────────────────────────────────────

    @Test
    void updateStatusToDeliveredShouldSetDeliveredAt() {
        UUID senderId = UUID.randomUUID();
        UUID recipientId = UUID.randomUUID();
        UUID roomId = UUID.randomUUID();

        ChatRoom room = buildRoom(senderId, recipientId);
        room.setId(roomId);
        ChatMessage msg = buildMessage(senderId, recipientId, roomId);
        msg.setChatRoomId(roomId);

        when(chatRoomRepository.isParticipant(roomId, recipientId)).thenReturn(true);
        when(chatRepository.findById(1L)).thenReturn(Optional.of(msg));
        when(chatRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        chatService.updateStatus(1L, roomId, recipientId, MessageStatus.DELIVERED);

        assertEquals(MessageStatus.DELIVERED, msg.getStatus());
        assertNotNull(msg.getDeliveredAt());
    }

    @Test
    void updateStatusToReadShouldSetReadAtAndDeliveredAt() {
        UUID senderId = UUID.randomUUID();
        UUID recipientId = UUID.randomUUID();
        UUID roomId = UUID.randomUUID();

        ChatRoom room = buildRoom(senderId, recipientId);
        room.setId(roomId);
        ChatMessage msg = buildMessage(senderId, recipientId, roomId);
        msg.setChatRoomId(roomId);

        when(chatRoomRepository.isParticipant(roomId, recipientId)).thenReturn(true);
        when(chatRepository.findById(1L)).thenReturn(Optional.of(msg));
        when(chatRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(notificationService).markChatRoomRead(any(), any());

        chatService.updateStatus(1L, roomId, recipientId, MessageStatus.READ);

        assertEquals(MessageStatus.READ, msg.getStatus());
        assertNotNull(msg.getReadAt());
        assertNotNull(msg.getDeliveredAt());
        verify(notificationService).markChatRoomRead(recipientId, roomId);
    }

    @Test
    void updateStatusShouldThrowWhenUpdaterIsNotRecipient() {
        UUID senderId = UUID.randomUUID();
        UUID recipientId = UUID.randomUUID();
        UUID roomId = UUID.randomUUID();

        ChatMessage msg = buildMessage(senderId, recipientId, roomId);
        msg.setChatRoomId(roomId);

        when(chatRoomRepository.isParticipant(roomId, senderId)).thenReturn(true);
        when(chatRepository.findById(1L)).thenReturn(Optional.of(msg));

        assertThrows(IllegalArgumentException.class,
            () -> chatService.updateStatus(1L, roomId, senderId, MessageStatus.READ));
    }

    // ── hideRoomForUser ──────────────────────────────────────────────────────

    @Test
    void hideRoomForCustomerShouldSetFlag() {
        UUID customerId = UUID.randomUUID();
        UUID providerId = UUID.randomUUID();
        UUID roomId = UUID.randomUUID();
        ChatRoom room = buildRoom(customerId, providerId);
        room.setId(roomId);

        when(chatRoomRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(chatRoomRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        chatService.hideRoomForUser(roomId, customerId);

        assertTrue(room.isHiddenForCustomer());
        assertFalse(room.isHiddenForProvider());
    }

    @Test
    void hideRoomForProviderShouldSetFlag() {
        UUID customerId = UUID.randomUUID();
        UUID providerId = UUID.randomUUID();
        UUID roomId = UUID.randomUUID();
        ChatRoom room = buildRoom(customerId, providerId);
        room.setId(roomId);

        when(chatRoomRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(chatRoomRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        chatService.hideRoomForUser(roomId, providerId);

        assertTrue(room.isHiddenForProvider());
        assertFalse(room.isHiddenForCustomer());
    }

    @Test
    void hideRoomForNonParticipantShouldThrow() {
        UUID customerId = UUID.randomUUID();
        UUID providerId = UUID.randomUUID();
        UUID outsiderId = UUID.randomUUID();
        UUID roomId = UUID.randomUUID();
        ChatRoom room = buildRoom(customerId, providerId);
        room.setId(roomId);

        when(chatRoomRepository.findById(roomId)).thenReturn(Optional.of(room));

        assertThrows(AccessDeniedException.class,
            () -> chatService.hideRoomForUser(roomId, outsiderId));
    }
}
