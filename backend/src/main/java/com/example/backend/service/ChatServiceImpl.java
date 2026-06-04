package com.example.backend.service;

import com.example.backend.domain.chat.ChatMessage;
import com.example.backend.domain.chat.ChatRoom;
import com.example.backend.domain.chat.MessageType;
import com.example.backend.domain.chat.MessageStatus;
import com.example.backend.domain.user.User;
import com.example.backend.dto.ChatMessageRequest;
import com.example.backend.dto.ChatMessageResponse;
import com.example.backend.dto.ChatRoomResponse;
import com.example.backend.dto.ChatRoomSummaryResponse;
import com.example.backend.repository.ChatRepository;
import com.example.backend.repository.ChatRoomRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatRepository chatRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

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
        // A new message un-hides the conversation for both participants (like WhatsApp).
        chatRoomRepository.findById(request.getChatRoomId()).ifPresent(room -> {
            if (room.isHiddenForCustomer() || room.isHiddenForProvider()) {
                room.setHiddenForCustomer(false);
                room.setHiddenForProvider(false);
                chatRoomRepository.save(room);
            }
        });
        notifyRecipientOfNewMessage(saved);
        return toResponse(saved);
    }

    /**
     * Raise an in-app notification for the message recipient. SYSTEM messages
     * (ticket lifecycle posts) are skipped, and any failure is swallowed so a
     * notification problem never breaks message delivery.
     */
    private void notifyRecipientOfNewMessage(ChatMessage message) {
        if (message.getType() == MessageType.SYSTEM) return;
        try {
            String senderName = userRepository.findById(message.getSenderId())
                .map(this::formatUserName)
                .orElse("New message");
            Long ticketId = chatRoomRepository.findById(message.getChatRoomId())
                .map(ChatRoom::getTicketId)
                .orElse(null);
            notificationService.notifyNewMessage(
                message.getRecipientId(), message.getChatRoomId(), ticketId, senderName);
        } catch (RuntimeException ex) {
            System.err.println("[chat] new-message notification failed for room "
                + message.getChatRoomId() + ": " + ex.getMessage());
        }
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
        if (status == MessageStatus.READ) {
            // Recipient has read the conversation — clear its grouped unread notification.
            try {
                notificationService.markChatRoomRead(userId, chatRoomId);
            } catch (RuntimeException ex) {
                System.err.println("[chat] clearing message notification failed for room "
                    + chatRoomId + ": " + ex.getMessage());
            }
        }
        return toResponse(saved);
    }

    @Override
    @Transactional
    public ChatMessageResponse editMessage(Long messageId, UUID userId, String newContent) {
        ChatMessage message = chatRepository.findById(messageId)
            .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        if (!userId.equals(message.getSenderId())) {
            throw new org.springframework.security.access.AccessDeniedException("You can only edit your own messages.");
        }
        if (message.isDeleted()) {
            throw new IllegalArgumentException("Cannot edit a deleted message.");
        }
        if (message.getType() != MessageType.TEXT) {
            throw new IllegalArgumentException("Only text messages can be edited.");
        }
        if (newContent == null || newContent.isBlank()) {
            throw new IllegalArgumentException("Message cannot be empty.");
        }
        message.setContent(newContent.trim());
        message.setEditedAt(LocalDateTime.now());
        return toResponse(chatRepository.save(message));
    }

    @Override
    @Transactional
    public ChatMessageResponse deleteMessage(Long messageId, UUID userId) {
        ChatMessage message = chatRepository.findById(messageId)
            .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        if (!userId.equals(message.getSenderId())) {
            throw new org.springframework.security.access.AccessDeniedException("You can only delete your own messages.");
        }
        message.setDeleted(true);
        return toResponse(chatRepository.save(message));
    }

    @Override
    @Transactional
    public void hideRoomForUser(UUID chatRoomId, UUID userId) {
        ChatRoom room = chatRoomRepository.findById(chatRoomId)
            .orElseThrow(() -> new IllegalArgumentException("Chat room not found"));
        if (userId.equals(room.getCustomerId())) {
            room.setHiddenForCustomer(true);
        } else if (userId.equals(room.getProviderId())) {
            room.setHiddenForProvider(true);
        } else {
            throw new org.springframework.security.access.AccessDeniedException("Not a participant of this conversation.");
        }
        chatRoomRepository.save(room);
    }

    @Override
    public List<UUID> getUserChatRooms(UUID userId) {
        return chatRoomRepository.findRoomIdsForUser(userId);
    }

    @Override
    public List<ChatRoomSummaryResponse> getUserChatRoomSummaries(UUID userId) {
        return chatRoomRepository.findRoomsForUser(userId).stream()
            // Skip conversations this user has removed from their own inbox.
            .filter(room -> !(userId.equals(room.getCustomerId()) ? room.isHiddenForCustomer() : room.isHiddenForProvider()))
            .map(room -> {
            UUID otherId = userId.equals(room.getCustomerId()) ? room.getProviderId() : room.getCustomerId();
            User other = userRepository.findById(otherId).orElse(null);
            String name = other != null ? other.displayName() : "Unknown"; // masks deleted accounts
            String pic  = other != null ? other.getProfilePictureUrl() : null;

            // Inbox preview + ordering: latest message and this user's unread count.
            ChatMessage last = chatRepository
                .findFirstByChatRoomIdOrderByTimestampDesc(room.getId())
                .orElse(null);
            long unread = chatRepository.countByChatRoomIdAndRecipientIdAndStatusNot(
                room.getId(), userId, MessageStatus.READ);

            return new ChatRoomSummaryResponse(
                room.getId(), otherId, name, pic,
                last != null ? last.getContent() : null,
                last != null ? last.getType() : null,
                last != null ? last.getTimestamp() : null,
                unread);
        })
        // Newest activity first; rooms with no messages sink to the bottom.
        .sorted(Comparator.comparing(
            ChatRoomSummaryResponse::getLastMessageTimestamp,
            Comparator.nullsLast(Comparator.reverseOrder())))
        .toList();
    }

    private String formatUserName(User user) {
        String full = ((user.getFirstName() != null ? user.getFirstName() : "") + " "
            + (user.getLastName() != null ? user.getLastName() : "")).trim();
        return full.isBlank() ? user.getEmail() : full;
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
            // Deleted content is never sent to clients — they render a placeholder.
            message.isDeleted() ? "" : message.getContent(),
            message.getType(),
            message.getStatus(),
            message.getDeliveredAt(),
            message.getReadAt(),
            message.getTimestamp(),
            message.getEditedAt(),
            message.isDeleted()
        );
    }
}
