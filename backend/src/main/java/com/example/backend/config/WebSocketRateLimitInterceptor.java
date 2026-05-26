package com.example.backend.config;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketRateLimitInterceptor implements ChannelInterceptor {

    private static final int MAX_MESSAGES = 10;
    private static final Duration WINDOW = Duration.ofSeconds(5);

    private final Map<UUID, Deque<Long>> messageTimes = new ConcurrentHashMap<>();

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        if (accessor.getCommand() != StompCommand.SEND) {
            return message;
        }
        String destination = accessor.getDestination();
        if (destination == null || !destination.startsWith("/app/chat")) {
            return message;
        }
        UUID userId = extractUserId(accessor);
        if (userId == null) {
            throw new AccessDeniedException("Missing authenticated user");
        }
        enforceLimit(userId);
        return message;
    }

    private void enforceLimit(UUID userId) {
        long now = System.currentTimeMillis();
        long windowStart = now - WINDOW.toMillis();
        Deque<Long> timestamps = messageTimes.computeIfAbsent(userId, key -> new ArrayDeque<>());
        synchronized (timestamps) {
            while (!timestamps.isEmpty() && timestamps.peekFirst() < windowStart) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= MAX_MESSAGES) {
                throw new AccessDeniedException("Rate limit exceeded for chat messages");
            }
            timestamps.addLast(now);
        }
    }

    private UUID extractUserId(StompHeaderAccessor accessor) {
        if (!(accessor.getUser() instanceof UsernamePasswordAuthenticationToken auth)) {
            return null;
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof com.example.backend.security.UserPrincipal userPrincipal) {
            return userPrincipal.getUser().getId();
        }
        return null;
    }
}

