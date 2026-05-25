package com.example.backend.web.dto.response;

import com.example.backend.domain.calendar.ProviderTimeBlock;
import com.example.backend.domain.calendar.TimeBlockType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class TimeBlockResponse {

    private UUID id;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private TimeBlockType type;
    private String title;
    private String notes;
    private Long ticketId;

    public static TimeBlockResponse from(ProviderTimeBlock b) {
        return TimeBlockResponse.builder()
            .id(b.getId())
            .startAt(b.getStartAt())
            .endAt(b.getEndAt())
            .type(b.getType())
            .title(b.getTitle())
            .notes(b.getNotes())
            .ticketId(b.getTicket() != null ? b.getTicket().getId() : null)
            .build();
    }
}
