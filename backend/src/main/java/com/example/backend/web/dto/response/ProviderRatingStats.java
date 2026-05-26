package com.example.backend.web.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderRatingStats {

    private UUID providerId;
    /** Mean rating, or null when the provider has no reviews yet. */
    private Double averageRating;
    private long reviewCount;
}
