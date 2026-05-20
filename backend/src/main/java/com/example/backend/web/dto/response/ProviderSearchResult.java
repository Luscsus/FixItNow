package com.example.backend.web.dto.response;

import com.example.backend.domain.user.Provider;
import com.example.backend.domain.user.ServiceCategory;
import com.example.backend.domain.user.UserStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
public class ProviderSearchResult {

    private UUID id;
    private String firstName;
    private String lastName;
    private BigDecimal locationLat;
    private BigDecimal locationLon;
    private BigDecimal pricePerHour;
    private Integer yearsOfExperience;
    private Integer serviceRadiusKm;
    private Set<ServiceCategory> categories;
    private String bio;
    private UserStatus status;
    private LocalDateTime createdAt;

    /** Populated only when the search included a location filter. */
    private Double distanceKm;

    public static ProviderSearchResult from(Provider p, Double distanceKm) {
        return ProviderSearchResult.builder()
            .id(p.getId())
            .firstName(p.getFirstName())
            .lastName(p.getLastName())
            .locationLat(p.getLocationLat())
            .locationLon(p.getLocationLon())
            .pricePerHour(p.getPricePerHour())
            .yearsOfExperience(p.getYearsOfExperience())
            .serviceRadiusKm(p.getServiceRadiusKm())
            .categories(p.getCategories())
            .bio(p.getBio())
            .status(p.getStatus())
            .createdAt(p.getCreatedAt())
            .distanceKm(distanceKm)
            .build();
    }
}
