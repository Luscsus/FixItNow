package com.example.backend.web.controller;

import com.example.backend.web.dto.response.MessageResponse;
import com.example.backend.security.UserPrincipal;
import com.example.backend.service.CalendarService;
import com.example.backend.web.dto.request.TimeBlockCreateRequest;
import com.example.backend.web.dto.request.TimeBlockUpdateRequest;
import com.example.backend.web.dto.response.PublicTimeBlockResponse;
import com.example.backend.web.dto.response.TimeBlockBatchResponse;
import com.example.backend.web.dto.response.TimeBlockResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/providers")
@RequiredArgsConstructor
@Tag(name = "Provider calendar", description = "Provider time blocks (availability, breaks, off, booked).")
public class ProviderCalendarController {

    private final CalendarService calendarService;

    @Operation(summary = "Public calendar for a provider (BOOKED entries shown as 'Busy').")
    @GetMapping("/{id}/calendar")
    public ResponseEntity<List<PublicTimeBlockResponse>> getPublicCalendar(
        @PathVariable UUID id,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        return ResponseEntity.ok(calendarService.listPublic(id, from, to));
    }

    @Operation(summary = "Authenticated provider's own calendar (full details).")
    @GetMapping("/me/calendar")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<List<TimeBlockResponse>> getOwnCalendar(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        return ResponseEntity.ok(calendarService.listOwn(principal.getUser().getId(), from, to));
    }

    @Operation(summary = "Create a time block, optionally repeating it into several occurrences.")
    @PostMapping("/me/calendar/blocks")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<TimeBlockBatchResponse> createBlock(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody TimeBlockCreateRequest req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(calendarService.create(principal.getUser().getId(), req));
    }

    @PutMapping("/me/calendar/blocks/{blockId}")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<TimeBlockResponse> updateBlock(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID blockId,
        @Valid @RequestBody TimeBlockUpdateRequest req
    ) {
        return ResponseEntity.ok(calendarService.update(principal.getUser().getId(), blockId, req));
    }

    @DeleteMapping("/me/calendar/blocks/{blockId}")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<MessageResponse> deleteBlock(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID blockId
    ) {
        calendarService.delete(principal.getUser().getId(), blockId);
        return ResponseEntity.ok(new MessageResponse("Time block deleted."));
    }

    @Operation(summary = "Delete every block in a recurring series.")
    @DeleteMapping("/me/calendar/blocks/series/{seriesId}")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<MessageResponse> deleteSeries(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID seriesId
    ) {
        calendarService.deleteSeries(principal.getUser().getId(), seriesId);
        return ResponseEntity.ok(new MessageResponse("Series deleted."));
    }
}
