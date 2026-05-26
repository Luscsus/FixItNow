package com.example.backend.repository;

import com.example.backend.domain.review.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {

    List<Review> findAllByProviderIdOrderByCreatedAtDesc(UUID providerId);

    Optional<Review> findByReviewerIdAndProviderId(UUID reviewerId, UUID providerId);

    long countByProviderId(UUID providerId);

    /**
     * Average rating for a provider, or null when there are no reviews.
     * Kept as two simple queries (this one + countByProviderId) instead of a
     * tuple projection — Hibernate's Object[] handling varies across versions
     * and was returning misleading data.
     */
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.provider.id = :providerId")
    Double averageRatingByProviderId(@Param("providerId") UUID providerId);
}
