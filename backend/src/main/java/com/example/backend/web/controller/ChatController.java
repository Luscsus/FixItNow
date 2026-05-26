package com.example.backend.web.controller;

import com.example.backend.dto.ChatMessageResponse;
import com.example.backend.dto.ChatRoomResponse;
import com.example.backend.dto.ChatRoomSummaryResponse;
import com.example.backend.security.UserPrincipal;
import com.example.backend.service.ChatService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Validated
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/rooms")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ChatRoomSummaryResponse>> getUserRooms(@AuthenticationPrincipal UserPrincipal userDetails) {
        return ResponseEntity.ok(chatService.getUserChatRoomSummaries(userDetails.getUser().getId()));
    }

    @GetMapping("/{chatRoomId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ChatRoomResponse> getChatRoom(
        @PathVariable UUID chatRoomId,
        @AuthenticationPrincipal UserPrincipal userDetails
    ) {
        return ResponseEntity.ok(chatService.getChatRoom(chatRoomId, userDetails.getUser().getId()));
    }

    @GetMapping("/{chatRoomId}/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(
        @PathVariable UUID chatRoomId,
        @AuthenticationPrincipal UserPrincipal userDetails,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime before,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "50") @Min(1) @Max(200) int size
    ) {
        return ResponseEntity.ok(chatService.getMessages(chatRoomId, userDetails.getUser().getId(), before, page, size));
    }
}
