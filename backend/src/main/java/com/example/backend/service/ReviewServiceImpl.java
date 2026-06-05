package com.example.backend.service;

import com.example.backend.common.exception.ApiException;
import com.example.backend.common.exception.ResourceNotFoundException;
import com.example.backend.domain.review.Review;
import com.example.backend.domain.ticket.TicketStatus;
import com.example.backend.domain.user.Provider;
import com.example.backend.domain.user.User;
import com.example.backend.repository.ProviderRepository;
import com.example.backend.repository.ReviewRepository;
import com.example.backend.repository.TicketRepository;
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
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

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

        // Reviewer must have actually worked with this provider on at least
        // one COMPLETED ticket. Note we run this check before fetching the
        // existing-review state so editing a review still re-validates the
        // relationship (covers the edge case where eligibility was somehow
        // revoked, e.g. ticket reset).
        boolean hasCompletedTicket = ticketRepository
            .existsByUser_IdAndAssignedServiceProvider_IdAndStatus(
                reviewerId, providerId, TicketStatus.COMPLETED);
        if (!hasCompletedTicket) {
            throw new ApiException(
                "You can leave a review only after a completed ticket with this provider."
            );
        }

        Optional<Review> existing = reviewRepository.findByReviewerIdAndProviderId(reviewerId, providerId);

        Review review;
        boolean isNew = existing.isEmpty();
        User reviewer;
        if (existing.isPresent()) {
            review = existing.get();
            review.setRating(request.getRating());
            review.setComment(request.getComment());
            reviewer = review.getReviewer();
            log.info("Updated review {} for provider {}", review.getId(), providerId);
        } else {
            reviewer = userRepository.findById(reviewerId)
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

        // Only a brand-new review counts as "received" — editing an existing one shouldn't re-alert.
        if (isNew) {
            notifyProviderOfReview(providerId, reviewer, saved.getRating());
        }
        return ReviewResponse.from(saved);
    }

    /**
     * Alert a provider that a customer left them a review. Preference-gated
     * ({@code reviewsReceived}); failures are swallowed so reviewing never breaks.
     */
    private void notifyProviderOfReview(UUID providerId, User reviewer, int rating) {
        try {
            String reviewerName = reviewer != null ? reviewer.displayName() : "A customer";
            notificationService.notifyReviewReceived(
                providerId,
                "New review",
                reviewerName + " left you a " + rating + "★ review.",
                "notifications.review.title",
                "notifications.review.body",
                java.util.Map.of("reviewerName", reviewerName, "rating", String.valueOf(rating))
            );
        } catch (RuntimeException ex) {
            log.warn("Review notification failed for provider {}: {}", providerId, ex.getMessage());
        }
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
