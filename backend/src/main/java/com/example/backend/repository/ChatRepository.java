package com.example.backend.repository;

import com.example.backend.domain.chat.ChatMessage;
import com.example.backend.domain.chat.MessageStatus;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface ChatRepository extends JpaRepository<ChatMessage, Long> {
    Slice<ChatMessage> findByChatRoomIdOrderByTimestampDesc(UUID chatRoomId, Pageable pageable);
    Slice<ChatMessage> findByChatRoomIdAndTimestampBeforeOrderByTimestampDesc(
        UUID chatRoomId,
        LocalDateTime timestamp,
        Pageable pageable
    );

    @Query("select distinct c.chatRoomId from ChatMessage c where c.senderId = :userId or c.recipientId = :userId")
    List<UUID> findDistinctChatRoomIdsForUser(@Param("userId") UUID userId);

    /** Most recent message in a room (for the inbox preview + ordering). */
    Optional<ChatMessage> findFirstByChatRoomIdOrderByTimestampDesc(UUID chatRoomId);

    /** Messages addressed to this user in this room that they haven't read yet. */
    long countByChatRoomIdAndRecipientIdAndStatusNot(UUID chatRoomId, UUID recipientId, MessageStatus status);
}
