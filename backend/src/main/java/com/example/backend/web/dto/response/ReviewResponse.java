package com.example.backend.web.dto.response;

import com.example.backend.domain.review.Review;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ReviewResponse {

    private UUID id;
    private UUID providerId;
    private UUID reviewerId;
    private String reviewerName;
    private String reviewerProfilePictureUrl;
    private int rating;
    private String comment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ReviewResponse from(Review r) {
        var reviewer = r.getReviewer();
        String name = (reviewer.getFirstName() + " " + reviewer.getLastName()).trim();
        return ReviewResponse.builder()
            .id(r.getId())
            .providerId(r.getProvider().getId())
            .reviewerId(reviewer.getId())
            .reviewerName(name.isEmpty() ? "Anonymous" : name)
            .reviewerProfilePictureUrl(reviewer.getProfilePictureUrl())
            .rating(r.getRating())
            .comment(r.getComment())
            .createdAt(r.getCreatedAt())
            .updatedAt(r.getUpdatedAt())
            .build();
    }
}
