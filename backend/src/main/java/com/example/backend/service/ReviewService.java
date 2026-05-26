package com.example.backend.service;

import com.example.backend.web.dto.request.CreateReviewRequest;
import com.example.backend.web.dto.response.ProviderRatingStats;
import com.example.backend.web.dto.response.ReviewResponse;

import java.util.List;
import java.util.UUID;

public interface ReviewService {

    /**
     * Create or update the current customer's review for a provider.
     * One review per (reviewer, provider) — re-submitting overwrites the prior one.
     */
    ReviewResponse upsertReview(UUID reviewerId, UUID providerId, CreateReviewRequest request);

    List<ReviewResponse> listForProvider(UUID providerId);

    ProviderRatingStats getStats(UUID providerId);

    /** Delete the current user's own review (no-op if none exists). */
    void deleteOwnReview(UUID reviewerId, UUID providerId);
}
