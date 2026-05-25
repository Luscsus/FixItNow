package com.example.backend.web.dto.response;

import com.example.backend.domain.calendar.ProviderTimeBlock;
import com.example.backend.domain.calendar.TimeBlockType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PublicTimeBlockResponse {

    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private TimeBlockType type;
    private String label;

    public static PublicTimeBlockResponse from(ProviderTimeBlock b) {
        String label;
        if (b.getType() == TimeBlockType.BOOKED) {
            label = "Busy";
        } else if (b.getTitle() != null && !b.getTitle().isBlank()) {
            label = b.getTitle();
        } else {
            label = switch (b.getType()) {
                case AVAILABLE -> "Available";
                case BREAK -> "Break";
                case OFF -> "Off";
                default -> "";
            };
        }
        return PublicTimeBlockResponse.builder()
            .startAt(b.getStartAt())
            .endAt(b.getEndAt())
            .type(b.getType())
            .label(label)
            .build();
    }
}
