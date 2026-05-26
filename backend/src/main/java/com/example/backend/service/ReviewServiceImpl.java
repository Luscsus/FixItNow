package com.example.backend.service;

import com.example.backend.common.exception.ApiException;
import com.example.backend.common.exception.ResourceNotFoundException;
import com.example.backend.domain.review.Review;
import com.example.backend.domain.user.Provider;
import com.example.backend.domain.user.User;
import com.example.backend.repository.ProviderRepository;
import com.example.backend.repository.ReviewRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.web.dto.request.CreateReviewRequest;
import com.example.backend.web.dto.response.ProviderRatingStats;
import com.example.backend.web.dto.response.ReviewResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProviderRepository providerRepository;
    private final UserRepository userRepository;

    @Override
    public ReviewResponse upsertReview(UUID reviewerId, UUID providerId, CreateReviewRequest request) {
        if (reviewerId.equals(providerId)) {
            throw new ApiException("You cannot review yourself.");
        }
        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new ApiException("Rating must be between 1 and 5.");
        }

        Provider provider = providerRepository.findById(providerId)
            .orElseThrow(() -> new ResourceNotFoundException("Provider not found."));

        Optional<Review> existing = reviewRepository.findByReviewerIdAndProviderId(reviewerId, providerId);

        Review review;
        if (existing.isPresent()) {
            review = existing.get();
            review.setRating(request.getRating());
            review.setComment(request.getComment());
            log.info("Updated review {} for provider {}", review.getId(), providerId);
        } else {
            User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
            review = Review.builder()
                .reviewer(reviewer)
                .provider(provider)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();
            log.info("Created new review for provider {} by user {}", providerId, reviewerId);
        }

        Review saved = reviewRepository.save(review);
        return ReviewResponse.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> listForProvider(UUID providerId) {
        return reviewRepository.findAllByProviderIdOrderByCreatedAtDesc(providerId).stream()
            .map(ReviewResponse::from)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProviderRatingStats getStats(UUID providerId) {
        long count = reviewRepository.countByProviderId(providerId);
        Double avg = count > 0 ? reviewRepository.averageRatingByProviderId(providerId) : null;
        return ProviderRatingStats.builder()
            .providerId(providerId)
            .averageRating(avg)
            .reviewCount(count)
            .build();
    }

    @Override
    public void deleteOwnReview(UUID reviewerId, UUID providerId) {
        reviewRepository.findByReviewerIdAndProviderId(reviewerId, providerId)
            .ifPresent(reviewRepository::delete);
    }
}
