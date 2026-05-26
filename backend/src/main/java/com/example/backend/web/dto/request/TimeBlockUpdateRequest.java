package com.example.backend.web.dto.request;

import com.example.backend.domain.calendar.TimeBlockType;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TimeBlockUpdateRequest {

    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private TimeBlockType type;

    @Size(max = 120)
    private String title;

    @Size(max = 500)
    private String notes;
}
