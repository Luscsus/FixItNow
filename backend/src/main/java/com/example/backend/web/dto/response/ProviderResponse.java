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
public class ProviderResponse {

    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private UserStatus status;
    private boolean emailVerified;
    private BigDecimal locationLat;
    private BigDecimal locationLon;
    private BigDecimal pricePerHour;
    private Integer yearsOfExperience;
    private Integer serviceRadiusKm;
    private Set<ServiceCategory> categories;
    private String bio;
    private String rejectionReason;
    private LocalDateTime approvedAt;
    private LocalDateTime createdAt;

    public static ProviderResponse from(Provider p) {
        return ProviderResponse.builder()
            .id(p.getId())
            .email(p.getEmail())
            .firstName(p.getFirstName())
            .lastName(p.getLastName())
            .phoneNumber(p.getPhoneNumber())
            .status(p.getStatus())
            .emailVerified(p.isEmailVerified())
            .locationLat(p.getLocationLat())
            .locationLon(p.getLocationLon())
            .pricePerHour(p.getPricePerHour())
            .yearsOfExperience(p.getYearsOfExperience())
            .serviceRadiusKm(p.getServiceRadiusKm())
            .categories(p.getCategories())
            .bio(p.getBio())
            .rejectionReason(p.getRejectionReason())
            .approvedAt(p.getApprovedAt())
            .createdAt(p.getCreatedAt())
            .build();
    }
}
