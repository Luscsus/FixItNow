package com.example.backend.web.controller;

import com.example.backend.repository.ProviderRepository;
import com.example.backend.service.ProviderSearchService;
import com.example.backend.web.dto.request.ProviderSearchParams;
import com.example.backend.web.dto.response.ProviderResponse;
import com.example.backend.web.dto.response.ProviderSearchResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/providers")
@RequiredArgsConstructor
@Tag(name = "Providers", description = "Provider discovery and search.")
public class ProviderController {

    private final ProviderSearchService providerSearchService;
    private final ProviderRepository providerRepository;

    @Operation(
        summary = "Search active providers",
        description = """
            Returns active providers that match all supplied filters.
            All parameters are optional and can be combined freely.
            When `latitude`, `longitude`, and `radiusKm` are provided, only providers
            within that radius are returned and each result includes a `distanceKm` field.
            Supports pagination via `page` (default 0) and `size` (default 20, max 100).
            """
    )
    @GetMapping("/search")
    public ResponseEntity<Page<ProviderSearchResult>> search(@Valid @ModelAttribute ProviderSearchParams params) {
        return ResponseEntity.ok(providerSearchService.search(params));
    }

    @Operation(summary = "Get a single provider's public profile by id")
    @GetMapping("/{providerId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ProviderResponse> getProvider(@PathVariable UUID providerId) {
        return providerRepository.findById(providerId)
            .map(ProviderResponse::from)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
