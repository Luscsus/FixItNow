package com.example.backend.repository;

import com.example.backend.domain.chat.ChatMessage;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
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
}
