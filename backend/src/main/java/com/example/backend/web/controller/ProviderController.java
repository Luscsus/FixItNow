package com.example.backend.web.controller;

import com.example.backend.domain.user.ServiceCategory;
import com.example.backend.service.CategoryClassifierService;
import com.example.backend.service.ProviderSearchService;
import com.example.backend.web.dto.request.ClassifyRequest;
import com.example.backend.web.dto.request.ProviderSearchParams;
import com.example.backend.web.dto.response.ClassifyResponse;
import com.example.backend.web.dto.response.ProviderSearchResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/providers")
@RequiredArgsConstructor
@Tag(name = "Providers", description = "Provider discovery and search.")
public class ProviderController {

    private final ProviderSearchService providerSearchService;
    private final CategoryClassifierService categoryClassifierService;

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

    @Operation(
        summary = "Classify a problem description into a service category",
        description = "Uses AI to pick the best matching category key from the provided list."
    )
    @PostMapping("/classify")
    public ResponseEntity<ClassifyResponse> classify(@Valid @RequestBody ClassifyRequest request) {
        String category = categoryClassifierService.classify(request.getProblemText(), request.getCategories());
        return ResponseEntity.ok(new ClassifyResponse(category));
    }

    @Operation(
        summary = "Public provider profile by id",
        description = "Returns the public-safe fields of a provider. Used by the provider profile page."
    )
    @GetMapping("/{id}")
    public ResponseEntity<ProviderSearchResult> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(providerSearchService.getPublicProfile(id));
    }
}
