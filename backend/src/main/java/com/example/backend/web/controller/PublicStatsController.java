package com.example.backend.web.controller;

import com.example.backend.service.PublicStatsService;
import com.example.backend.web.dto.response.PublicStatsResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/stats")
@RequiredArgsConstructor
@Tag(name = "Public stats", description = "Aggregate marketplace metrics for the landing page.")
public class PublicStatsController {

    private final PublicStatsService publicStatsService;

    @Operation(summary = "Aggregate marketplace stats (public).")
    @GetMapping
    public ResponseEntity<PublicStatsResponse> getStats() {
        return ResponseEntity.ok(publicStatsService.getStats());
    }
}
