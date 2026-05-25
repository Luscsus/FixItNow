package com.example.backend.web.controller;

import com.example.backend.dto.ChatMessageRequest;
import com.example.backend.dto.ChatMessageResponse;
import com.example.backend.dto.ChatMessageStatusRequest;
import com.example.backend.dto.ChatTypingEvent;
import com.example.backend.security.UserPrincipal;
import com.example.backend.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void sendMessage(@Valid @Payload ChatMessageRequest request, Principal principal) {
        UserPrincipal userPrincipal = requireUser(principal);
        if (!userPrincipal.getUser().getId().equals(request.getSenderId())) {
            throw new AccessDeniedException("Sender does not match authenticated user");
        }
        ChatMessageResponse saved = chatService.saveMessage(request);
        messagingTemplate.convertAndSend("/topic/chat/" + saved.getChatRoomId(), saved);
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
