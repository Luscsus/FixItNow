package com.example.backend.web.dto.response;

import com.example.backend.domain.user.Provider;
import com.example.backend.domain.user.ServiceCategory;
import com.example.backend.domain.user.UserStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
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
    private String profilePictureUrl;
    private UserStatus status;
    private boolean emailVerified;
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
    private String rejectionReason;
    private LocalDateTime approvedAt;
    private LocalDateTime createdAt;
    private Map<String, Boolean> notificationPreferences;
    // Payout / bank details — only included in this DTO because it's served to
    // the provider themselves (or to admins). NOT included in public DTOs.
    private String bankAccountHolder;
    private String bankIban;
    private String bankBic;
    private String bankName;

    public static ProviderResponse from(Provider p) {
        return ProviderResponse.builder()
            .id(p.getId())
            .email(p.getEmail())
            .firstName(p.getFirstName())
            .lastName(p.getLastName())
            .phoneNumber(p.getPhoneNumber())
            .profilePictureUrl(p.getProfilePictureUrl())
            .status(p.getStatus())
            .emailVerified(p.isEmailVerified())
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
            .rejectionReason(p.getRejectionReason())
            .approvedAt(p.getApprovedAt())
            .createdAt(p.getCreatedAt())
            .notificationPreferences(p.getNotificationPreferences() != null ? p.getNotificationPreferences() : new HashMap<>())
            .bankAccountHolder(p.getBankAccountHolder())
            .bankIban(p.getBankIban())
            .bankBic(p.getBankBic())
            .bankName(p.getBankName())
            .build();
    }
}
