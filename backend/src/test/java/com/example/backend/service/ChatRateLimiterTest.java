package com.example.backend.service;

import com.example.backend.exception.ChatMessageRejectedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ChatRateLimiterTest {

    private ChatRateLimiter limiter;
    private final UUID userId = UUID.randomUUID();
    private final UUID roomId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        limiter = new ChatRateLimiter();
    }

    @Test
    void normalMessageShouldPass() {
        assertDoesNotThrow(() -> limiter.check(userId, roomId, "Hello!", true));
    }

    @Test
    void messageTooLongShouldThrow() {
        String longMsg = "x".repeat(ChatRateLimiter.MAX_LENGTH + 1);
        ChatMessageRejectedException ex = assertThrows(
            ChatMessageRejectedException.class,
            () -> limiter.check(userId, roomId, longMsg, true)
        );
        assertEquals("TOO_LONG", ex.getCode());
    }

    @Test
    void exactMaxLengthShouldPass() {
        String maxMsg = "x".repeat(ChatRateLimiter.MAX_LENGTH);
        assertDoesNotThrow(() -> limiter.check(userId, roomId, maxMsg, true));
    }

    @Test
    void duplicateTextWithinWindowShouldThrow() throws InterruptedException {
        limiter.check(userId, roomId, "Hello!", true);
        // Second identical message immediately after — within dup window
        Thread.sleep(ChatRateLimiter.MIN_INTERVAL_MS + 10);
        ChatMessageRejectedException ex = assertThrows(
            ChatMessageRejectedException.class,
            () -> limiter.check(userId, roomId, "Hello!", true)
        );
        assertEquals("DUPLICATE", ex.getCode());
    }

    @Test
    void differentTextAfterDuplicateWindowShouldPass() throws InterruptedException {
        limiter.check(userId, roomId, "Hello!", true);
        Thread.sleep(ChatRateLimiter.MIN_INTERVAL_MS + 10);
        assertDoesNotThrow(() -> limiter.check(userId, roomId, "Different message", true));
    }

    @Test
    void floodProtectionShouldThrowOnTooFastSecondMessage() {
        limiter.check(userId, roomId, "First", true);
        // Immediately send second message — under MIN_INTERVAL_MS
        ChatMessageRejectedException ex = assertThrows(
            ChatMessageRejectedException.class,
            () -> limiter.check(userId, roomId, "Second", true)
        );
        assertEquals("FLOOD", ex.getCode());
    }

    @Test
    void differentUsersAreTrackedSeparately() {
        UUID user2 = UUID.randomUUID();
        limiter.check(userId, roomId, "Hello!", true);
        // user2 has not sent anything — should pass immediately
        assertDoesNotThrow(() -> limiter.check(user2, roomId, "Hello!", true));
    }

    @Test
    void differentRoomsAreTrackedSeparately() throws InterruptedException {
        UUID room2 = UUID.randomUUID();
        limiter.check(userId, roomId, "Hello!", true);
        Thread.sleep(ChatRateLimiter.MIN_INTERVAL_MS + 10);
        // Same user, different room — duplicate check is per-room, should NOT fire
        assertDoesNotThrow(() -> limiter.check(userId, room2, "Hello!", true));
    }

    @Test
    void nonTextMessageShouldSkipDuplicateCheck() throws InterruptedException {
        limiter.check(userId, roomId, "Hello!", false);
        Thread.sleep(ChatRateLimiter.MIN_INTERVAL_MS + 10);
        // isText=false — duplicate guard skipped
        assertDoesNotThrow(() -> limiter.check(userId, roomId, "Hello!", false));
    }

    @Test
    void perConversationLimitShouldThrowAfterMax() throws InterruptedException {
        for (int i = 0; i < ChatRateLimiter.PER_CONVO_MAX; i++) {
            limiter.check(userId, roomId, "msg " + i, true);
            Thread.sleep(ChatRateLimiter.MIN_INTERVAL_MS + 10);
        }
        // Next message must be rejected with RATE_LIMIT_CONVERSATION
        ChatMessageRejectedException ex = assertThrows(
            ChatMessageRejectedException.class,
            () -> limiter.check(userId, roomId, "overflow", true)
        );
        assertEquals("RATE_LIMIT_CONVERSATION", ex.getCode());
        assertTrue(ex.getRetryAfterSeconds() > 0);
    }

    @Test
    void nullContentWithTextFlagShouldPass() {
        // null content — length check skips (content == null), dup check also skips
        assertDoesNotThrow(() -> limiter.check(userId, roomId, null, true));
    }

    @Test
    void retryAfterSecondsIsPositiveOnRateLimit() throws InterruptedException {
        for (int i = 0; i < ChatRateLimiter.PER_CONVO_MAX; i++) {
            limiter.check(userId, roomId, "msg " + i, true);
            Thread.sleep(ChatRateLimiter.MIN_INTERVAL_MS + 10);
        }
        ChatMessageRejectedException ex = assertThrows(
            ChatMessageRejectedException.class,
            () -> limiter.check(userId, roomId, "extra", true)
        );
        assertTrue(ex.getRetryAfterSeconds() >= 1);
    }
}
