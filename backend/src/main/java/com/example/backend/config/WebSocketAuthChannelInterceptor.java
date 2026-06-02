package com.example.backend.config;

import com.example.backend.security.CustomUserDetailsService;
import com.example.backend.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.security.Principal;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String AUTH_SESSION_ATTR = "ws.auth";

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        // IMPORTANT: use getAccessor (not wrap) — wrap() is read-only and any
        // setUser() call would be lost. getAccessor returns the mutable accessor
        // that actually persists changes onto the message / session.
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }
        StompCommand command = accessor.getCommand();
        if (command == null) {
            return message;
        }

        try {
            if (command == StompCommand.CONNECT) {
                authenticateConnect(accessor);
            } else if (command == StompCommand.SEND || command == StompCommand.SUBSCRIBE) {
                rebindSessionUser(accessor);
            }
        } catch (AccessDeniedException ex) {
            // Expected, client-driven case: a missing/expired/invalid token (e.g. a
            // reconnecting client whose session lapsed). Reject the frame but keep the
            // log quiet — DEBUG, no stack trace — so it doesn't flood the console.
            log.debug("[ws-auth] rejected command={} session={}: {}",
                command, accessor.getSessionId(), ex.getMessage());
            throw ex;
        } catch (RuntimeException ex) {
            // Anything else is genuinely unexpected — log it loudly with the stack trace.
            log.error("[ws-auth] interceptor failed for command={} session={} dest={} : {}",
                command, accessor.getSessionId(), accessor.getDestination(), ex.toString(), ex);
            throw ex;
        }

        return message;
    }

    private void authenticateConnect(StompHeaderAccessor accessor) {
        String token = extractToken(accessor);
        if (!StringUtils.hasText(token) || !jwtTokenProvider.isTokenValid(token)) {
            throw new AccessDeniedException("Invalid or missing JWT");
        }
        String email = jwtTokenProvider.extractEmail(token);
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        UsernamePasswordAuthenticationToken authentication =
            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

        accessor.setUser(authentication);
        // Stash in session attributes as a belt-and-suspenders fallback
        Map<String, Object> attrs = accessor.getSessionAttributes();
        if (attrs != null) {
            attrs.put(AUTH_SESSION_ATTR, authentication);
        }
        SecurityContextHolder.getContext().setAuthentication(authentication);
        log.debug("[ws-auth] CONNECT authenticated user={} session={}", email, accessor.getSessionId());
    }

    private void rebindSessionUser(StompHeaderAccessor accessor) {
        Principal user = accessor.getUser();
        UsernamePasswordAuthenticationToken auth = null;

        if (user instanceof UsernamePasswordAuthenticationToken upa) {
            auth = upa;
        } else {
            Map<String, Object> attrs = accessor.getSessionAttributes();
            Object stored = attrs != null ? attrs.get(AUTH_SESSION_ATTR) : null;
            if (stored instanceof UsernamePasswordAuthenticationToken upa) {
                auth = upa;
                accessor.setUser(auth);
            }
        }

        if (auth == null) {
            throw new AccessDeniedException("No authenticated user on STOMP session");
        }
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private String extractToken(StompHeaderAccessor accessor) {
        String header = accessor.getFirstNativeHeader(AUTHORIZATION_HEADER);
        if (!StringUtils.hasText(header)) {
            header = accessor.getFirstNativeHeader(AUTHORIZATION_HEADER.toLowerCase());
        }
        if (StringUtils.hasText(header) && header.startsWith(BEARER_PREFIX)) {
            return header.substring(BEARER_PREFIX.length());
        }
        return null;
    }
}
