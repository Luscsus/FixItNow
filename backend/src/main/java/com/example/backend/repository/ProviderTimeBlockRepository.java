package com.example.backend.repository;

import com.example.backend.domain.calendar.ProviderTimeBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProviderTimeBlockRepository extends JpaRepository<ProviderTimeBlock, UUID> {

    @Query("""
        SELECT b FROM ProviderTimeBlock b
        WHERE b.provider.id = :providerId
          AND b.startAt < :rangeEnd
          AND b.endAt > :rangeStart
        ORDER BY b.startAt ASC
        """)
    List<ProviderTimeBlock> findInRange(
        @Param("providerId") UUID providerId,
        @Param("rangeStart") LocalDateTime rangeStart,
        @Param("rangeEnd") LocalDateTime rangeEnd
    );

    Optional<ProviderTimeBlock> findByTicket_Id(Long ticketId);

    @Query("""
        SELECT (COUNT(b) > 0) FROM ProviderTimeBlock b
        WHERE b.provider.id = :providerId
          AND b.type <> com.example.backend.domain.calendar.TimeBlockType.BOOKED
          AND b.startAt < :end
          AND b.endAt > :start
          AND (:excludeId IS NULL OR b.id <> :excludeId)
        """)
    boolean existsOverlap(
        @Param("providerId") UUID providerId,
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end,
        @Param("excludeId") UUID excludeId
    );
}
