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
    private String locationStreetName;
    private String locationStreetNumber;
    private String locationCity;
    private String locationPostalCode;
    private String locationCountry;
    private Double locationLat;
    private Double locationLon;
    private BigDecimal pricePerHour;
    private Integer yearsOfExperience;
    private Integer serviceRadiusKm;
    private Set<ServiceCategory> categories;
    private String bio;
    private String profilePictureUrl;
    private UserStatus status;
    private LocalDateTime createdAt;
    /** Whether the provider has confirmed their email. Used to render a verified badge. */
    private boolean emailVerified;

    /** Populated only when the search included a location filter. */
    private Double distanceKm;

    public static ProviderSearchResult from(Provider p, Double distanceKm) {
        return ProviderSearchResult.builder()
            .id(p.getId())
            .firstName(p.getFirstName())
            .lastName(p.getLastName())
            .locationStreetName(p.getLocation() != null ? p.getLocation().getStreetName() : null)
            .locationStreetNumber(p.getLocation() != null ? p.getLocation().getStreetNumber() : null)
            .locationCity(p.getLocation() != null ? p.getLocation().getCity() : null)
            .locationPostalCode(p.getLocation() != null ? p.getLocation().getPostalCode() : null)
            .locationCountry(p.getLocation() != null ? p.getLocation().getCountry() : null)
            .locationLat(p.getLocation() != null ? p.getLocation().getLatitude() : null)
            .locationLon(p.getLocation() != null ? p.getLocation().getLongitude() : null)
            .pricePerHour(p.getPricePerHour())
            .yearsOfExperience(p.getYearsOfExperience())
            .serviceRadiusKm(p.getServiceRadiusKm())
            .categories(p.getCategories())
            .bio(p.getBio())
            .profilePictureUrl(p.getProfilePictureUrl())
            .status(p.getStatus())
            .createdAt(p.getCreatedAt())
            .emailVerified(p.isEmailVerified())
            .distanceKm(distanceKm)
            .build();
    }
}
