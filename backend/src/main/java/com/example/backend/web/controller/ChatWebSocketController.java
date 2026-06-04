package com.example.backend.web.controller;

import com.example.backend.domain.chat.MessageType;
import com.example.backend.dto.ChatErrorResponse;
import com.example.backend.dto.ChatMessageRequest;
import com.example.backend.dto.ChatMessageResponse;
import com.example.backend.dto.ChatMessageStatusRequest;
import com.example.backend.dto.ChatTypingEvent;
import com.example.backend.exception.ChatMessageRejectedException;
import com.example.backend.security.UserPrincipal;
import com.example.backend.service.ChatRateLimiter;
import com.example.backend.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final ChatRateLimiter chatRateLimiter;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void sendMessage(@Valid @Payload ChatMessageRequest request, Principal principal) {
        UserPrincipal userPrincipal = requireUser(principal);
        if (!userPrincipal.getUser().getId().equals(request.getSenderId())) {
            throw new AccessDeniedException("Sender does not match authenticated user");
        }
        // Anti-spam / rate limiting — enforced server-side so it cannot be
        // bypassed by tampering with the client. Throws ChatMessageRejectedException
        // (handled below) on violation, without dropping the WebSocket connection.
        boolean isText = request.getType() == null || request.getType() == MessageType.TEXT;
        chatRateLimiter.check(
            userPrincipal.getUser().getId(), request.getChatRoomId(), request.getContent(), isText);

        ChatMessageResponse saved = chatService.saveMessage(request);
        messagingTemplate.convertAndSend("/topic/chat/" + saved.getChatRoomId(), saved);
    }

    /**
     * Relays a rejected-message error to ONLY the offending sender's private
     * queue (/user/queue/errors). {@code broadcast = false} keeps it to the
     * session that triggered it; the connection stays open.
     */
    @MessageExceptionHandler(ChatMessageRejectedException.class)
    @SendToUser(destinations = "/queue/errors", broadcast = false)
    public ChatErrorResponse handleRejectedMessage(ChatMessageRejectedException ex) {
        return new ChatErrorResponse(ex.getCode(), ex.getMessage(), ex.getRetryAfterSeconds(), ex.getChatRoomId());
    }

    @MessageMapping("/chat.edit")
    public void editMessage(@Valid @Payload com.example.backend.dto.ChatMessageEditRequest request, Principal principal) {
        UserPrincipal userPrincipal = requireUser(principal);
        if (!userPrincipal.getUser().getId().equals(request.getUserId())) {
            throw new AccessDeniedException("User does not match authenticated user");
        }
        ChatMessageResponse updated = chatService.editMessage(
            request.getMessageId(), userPrincipal.getUser().getId(), request.getContent());
        messagingTemplate.convertAndSend("/topic/chat/" + updated.getChatRoomId(), updated);
    }

    @MessageMapping("/chat.delete")
    public void deleteMessage(@Valid @Payload com.example.backend.dto.ChatMessageEditRequest request, Principal principal) {
        UserPrincipal userPrincipal = requireUser(principal);
        if (!userPrincipal.getUser().getId().equals(request.getUserId())) {
            throw new AccessDeniedException("User does not match authenticated user");
        }
        ChatMessageResponse updated = chatService.deleteMessage(
            request.getMessageId(), userPrincipal.getUser().getId());
        messagingTemplate.convertAndSend("/topic/chat/" + updated.getChatRoomId(), updated);
    }

    @MessageMapping("/chat.typing")
    public void typing(@Valid @Payload ChatTypingEvent event, Principal principal) {
        UserPrincipal userPrincipal = requireUser(principal);
        if (!userPrincipal.getUser().getId().equals(event.getUserId())) {
            throw new AccessDeniedException("User does not match authenticated user");
        }
        chatService.assertParticipant(event.getChatRoomId(), event.getUserId());
        messagingTemplate.convertAndSend("/topic/chat/" + event.getChatRoomId() + "/typing", event);
    }

    @MessageMapping("/chat.status")
    public void updateStatus(@Valid @Payload ChatMessageStatusRequest request, Principal principal) {
        UserPrincipal userPrincipal = requireUser(principal);
        if (!userPrincipal.getUser().getId().equals(request.getUserId())) {
            throw new AccessDeniedException("User does not match authenticated user");
        }
        chatService.assertParticipant(request.getChatRoomId(), request.getUserId());
        ChatMessageResponse updated = chatService.updateStatus(
            request.getMessageId(),
            request.getChatRoomId(),
            request.getUserId(),
            request.getStatus()
        );
        messagingTemplate.convertAndSend("/topic/chat/" + updated.getChatRoomId() + "/status", updated);
    }

    private UserPrincipal requireUser(Principal principal) {
        if (!(principal instanceof UsernamePasswordAuthenticationToken auth)
            || !(auth.getPrincipal() instanceof UserPrincipal userPrincipal)) {
            throw new AccessDeniedException("Missing or invalid authentication");
        }
        return userPrincipal;
    }
}
