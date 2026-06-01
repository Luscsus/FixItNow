package com.example.backend.web.controller;

import com.example.backend.service.GeocodingService;
import com.example.backend.service.GeocodingService.AddressSuggestion;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Address autocomplete backed by the geocoding provider. */
@RestController
@RequestMapping("/api/v1/geocode")
@RequiredArgsConstructor
@Tag(name = "Geocoding", description = "Address search / autocomplete.")
public class GeocodeController {

    private final GeocodingService geocodingService;

    @Operation(summary = "Search addresses for autocomplete (public).")
    @GetMapping("/search")
    public ResponseEntity<List<AddressSuggestion>> search(
        @RequestParam("q") String query,
        @RequestParam(value = "limit", defaultValue = "5") int limit
    ) {
        return ResponseEntity.ok(geocodingService.search(query, limit));
    }
}
