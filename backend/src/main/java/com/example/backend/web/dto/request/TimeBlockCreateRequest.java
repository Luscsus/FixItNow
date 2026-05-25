package com.example.backend.web.dto.request;

import com.example.backend.domain.calendar.TimeBlockType;
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
}
