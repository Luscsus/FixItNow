package com.example.backend.web.controller;

import com.example.backend.security.UserPrincipal;
import com.example.backend.service.ReviewService;
import com.example.backend.web.dto.request.CreateReviewRequest;
import com.example.backend.web.dto.response.MessageResponse;
import com.example.backend.web.dto.response.ProviderRatingStats;
import com.example.backend.web.dto.response.ReviewResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/providers/{providerId}/reviews")
@RequiredArgsConstructor
@Tag(name = "Reviews", description = "Customer reviews of service providers.")
public class ReviewController {

    private final ReviewService reviewService;

    @Operation(summary = "List all reviews for a provider (public).")
    @GetMapping
    public ResponseEntity<List<ReviewResponse>> list(@PathVariable UUID providerId) {
        return ResponseEntity.ok(reviewService.listForProvider(providerId));
    }

    @Operation(summary = "Aggregate rating stats for a provider (public).")
    @GetMapping("/stats")
    public ResponseEntity<ProviderRatingStats> stats(@PathVariable UUID providerId) {
        return ResponseEntity.ok(reviewService.getStats(providerId));
    }

    @Operation(summary = "Create or update the current customer's review for a provider.")
    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ReviewResponse> create(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID providerId,
        @Valid @RequestBody CreateReviewRequest request
    ) {
        UUID reviewerId = principal.getUser().getId();
        return ResponseEntity.ok(reviewService.upsertReview(reviewerId, providerId, request));
    }

    @Operation(summary = "Delete the current user's review for this provider.")
    @DeleteMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<MessageResponse> deleteOwn(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID providerId
    ) {
        UUID reviewerId = principal.getUser().getId();
        reviewService.deleteOwnReview(reviewerId, providerId);
        return ResponseEntity.ok(new MessageResponse("Review deleted"));
    }
}
