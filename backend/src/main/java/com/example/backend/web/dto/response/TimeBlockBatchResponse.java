package com.example.backend.web.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Result of creating a (possibly repeating) time block: the occurrences actually created plus
 * the start times of any occurrences skipped because they overlapped an existing block.
 */
@Data
@Builder
public class TimeBlockBatchResponse {

    private List<TimeBlockResponse> created;
    private List<LocalDateTime> skipped;
}
