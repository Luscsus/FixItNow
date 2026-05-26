package com.example.backend.repository;

import com.example.backend.domain.chat.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {

    Optional<ChatRoom> findByTicketId(Long ticketId);

    @Query("select case when count(c) > 0 then true else false end from ChatRoom c " +
        "where c.id = :roomId and (c.customerId = :userId or c.providerId = :userId)")
    boolean isParticipant(@Param("roomId") UUID roomId, @Param("userId") UUID userId);

    @Query("select c.id from ChatRoom c where c.customerId = :userId or c.providerId = :userId")
    List<UUID> findRoomIdsForUser(@Param("userId") UUID userId);

    @Query("select c from ChatRoom c where c.customerId = :userId or c.providerId = :userId")
    List<ChatRoom> findRoomsForUser(@Param("userId") UUID userId);
}

