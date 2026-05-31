package com.example.backend.web.dto.request;

import com.example.backend.domain.calendar.RecurrenceFrequency;
import com.example.backend.domain.calendar.TimeBlockType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TimeBlockCreateRequest {

    @NotNull
    private LocalDateTime startAt;

    @NotNull
    private LocalDateTime endAt;

    @NotNull
    private TimeBlockType type;

    @Size(max = 120)
    private String title;

    @Size(max = 500)
    private String notes;

    /** Optional. When present, the block is materialized into {@code count} occurrences. */
    @Valid
    private Recurrence recurrence;

    @Data
    public static class Recurrence {

        @NotNull
        private RecurrenceFrequency frequency;

        /** Total number of occurrences including the first one. */
        @Min(2)
        @Max(12)
        private int count;
    }
}
