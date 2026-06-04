package com.example.backend.service;

import com.example.backend.exception.ChatMessageRejectedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Server-side anti-spam / rate limiting for chat messages. Enforced in the chat
 * WebSocket controller so it cannot be bypassed from the client. In-memory
 * sliding windows keyed by the authenticated user (single-instance; for a
 * horizontally-scaled deployment this would move to Redis).
 *
 * Rules:
 *   • Flood    — at least {@value #MIN_INTERVAL_MS} ms between messages.
 *   • Per conversation — max {@value #PER_CONVO_MAX} messages / minute / room.
 *   • Per user — max {@value #PER_USER_MAX} messages / hour across all rooms.
 *   • Duplicate — identical text within {@value #DUP_WINDOW_MS} ms is rejected.
 *   • Length   — content capped at {@value #MAX_LENGTH} characters.
 */
@Component
public class ChatRateLimiter {

    private static final Logger log = LoggerFactory.getLogger(ChatRateLimiter.class);

    static final int  PER_CONVO_MAX        = 10;
    static final long PER_CONVO_WINDOW_MS  = 60_000;       // 1 minute
    static final int  PER_USER_MAX         = 50;
    static final long PER_USER_WINDOW_MS   = 3_600_000;    // 1 hour
    static final long MIN_INTERVAL_MS      = 500;          // flood guard
    static final long DUP_WINDOW_MS        = 10_000;       // duplicate window
    static final int  MAX_LENGTH           = 2_000;

    private final Map<String, Deque<Long>> convoHits   = new ConcurrentHashMap<>(); // key: user:room
    private final Map<UUID, Deque<Long>>   userHits    = new ConcurrentHashMap<>();
    private final Map<UUID, Long>          lastSendAt  = new ConcurrentHashMap<>();
    private final Map<String, RecentText>  lastContent = new ConcurrentHashMap<>(); // key: user:room

    private record RecentText(String content, long at) {}

    /**
     * Validates a pending message. Throws {@link ChatMessageRejectedException}
     * (with a code + retry hint) when a rule is violated; records the send and
     * returns normally when allowed.
     */
    public void check(UUID userId, UUID roomId, String content, boolean isText) {
        final long now = System.currentTimeMillis();
        final String convoKey = userId + ":" + roomId;

        // 1. Length
        if (content != null && content.length() > MAX_LENGTH) {
            reject(userId, roomId, "TOO_LONG", 0,
                "Message is too long (max " + MAX_LENGTH + " characters).");
        }

        // 2. Flood — minimum interval between any two messages
        Long last = lastSendAt.get(userId);
        if (last != null && now - last < MIN_INTERVAL_MS) {
            reject(userId, roomId, "FLOOD", 1, "You're sending messages too quickly.");
        }

        // 3. Duplicate — identical text in the same room within the window
        if (isText && content != null) {
            RecentText prev = lastContent.get(convoKey);
            if (prev != null && prev.at() > now - DUP_WINDOW_MS && prev.content().equals(content.trim())) {
                reject(userId, roomId, "DUPLICATE", ceilSeconds(DUP_WINDOW_MS - (now - prev.at())),
                    "You just sent that message.");
            }
        }

        // 4. Per-conversation window (read-only count; recorded only if all pass)
        long convoRetry = retryAfterIfExceeded(
            convoHits.computeIfAbsent(convoKey, k -> new ArrayDeque<>()), now, PER_CONVO_WINDOW_MS, PER_CONVO_MAX);
        if (convoRetry > 0) {
            reject(userId, roomId, "RATE_LIMIT_CONVERSATION", convoRetry,
                "Too many messages in this conversation.");
        }

        // 5. Per-user hourly window
        long userRetry = retryAfterIfExceeded(
            userHits.computeIfAbsent(userId, k -> new ArrayDeque<>()), now, PER_USER_WINDOW_MS, PER_USER_MAX);
        if (userRetry > 0) {
            reject(userId, roomId, "RATE_LIMIT_HOURLY", userRetry, "Hourly message limit reached.");
        }

        // Allowed — record the send across all windows.
        lastSendAt.put(userId, now);
        record(convoHits.get(convoKey), now);
        record(userHits.get(userId), now);
        if (isText && content != null) {
            lastContent.put(convoKey, new RecentText(content.trim(), now));
        }
    }

    /** Evicts expired timestamps and returns seconds-until-allowed if at capacity, else 0. */
    private long retryAfterIfExceeded(Deque<Long> dq, long now, long windowMs, int max) {
        synchronized (dq) {
            long windowStart = now - windowMs;
            while (!dq.isEmpty() && dq.peekFirst() < windowStart) dq.pollFirst();
            if (dq.size() >= max) {
                long oldest = dq.peekFirst();
                return Math.max(1, ceilSeconds(oldest + windowMs - now));
            }
            return 0;
        }
    }

    private void record(Deque<Long> dq, long now) {
        if (dq == null) return;
        synchronized (dq) { dq.addLast(now); }
    }

    private long ceilSeconds(long ms) {
        return (long) Math.ceil(Math.max(0, ms) / 1000.0);
    }

    private void reject(UUID userId, UUID roomId, String code, long retryAfter, String message) {
        log.warn("[chat-ratelimit] rejected user={} room={} code={} retryAfter={}s", userId, roomId, code, retryAfter);
        throw new ChatMessageRejectedException(code, message, retryAfter, roomId);
    }
}
