package com.example.backend.web.controller;

import com.example.backend.domain.user.ServiceCategory;
import com.example.backend.service.ProviderSearchService;
import com.example.backend.web.dto.request.ProviderSearchParams;
import com.example.backend.web.dto.response.ProviderSearchResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

@RestController
@RequestMapping("/api/v1/providers")
@RequiredArgsConstructor
@Tag(name = "Providers", description = "Provider discovery and search.")
public class ProviderController {

    private final ProviderSearchService providerSearchService;

    @Operation(
        summary = "Get categories with active providers",
        description = "Returns the set of service categories that have at least one active provider."
    )
    @GetMapping("/categories")
    public ResponseEntity<Set<ServiceCategory>> getActiveCategories() {
        return ResponseEntity.ok(providerSearchService.getActiveCategories());
    }

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
}
