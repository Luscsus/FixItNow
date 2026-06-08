package com.example.backend.web.dto.response;

import com.example.backend.domain.user.User;
import com.example.backend.domain.user.UserRole;
import com.example.backend.domain.user.UserStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class UserSummaryResponse {

    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private UserRole role;
    private UserStatus status;
    private boolean emailVerified;
    private String profilePictureUrl;
    private String phoneNumber;
    private LocalDateTime createdAt;
    private Map<String, Boolean> notificationPreferences;
    /** The user's saved default location, or null if they haven't set one. */
    private SavedLocation location;

    // Soft-delete metadata (for the admin panel).
    private boolean deleted;
    private LocalDateTime deletedAt;
    private String deletionReason;

    /** Customer's default location, used to pre-fill the new-ticket form. */
    @Data
    @Builder
    public static class SavedLocation {
        private String address;
        private Double latitude;
        private Double longitude;
    }

    public static UserSummaryResponse from(User u) {
        SavedLocation loc = null;
        var l = u.getLocation();
        if (l != null && l.getStreetName() != null && !l.getStreetName().isBlank()) {
            loc = SavedLocation.builder()
                .address(l.getFormattedAddress())
                .latitude(l.getLatitude())
                .longitude(l.getLongitude())
                .build();
        }
        return UserSummaryResponse.builder()
            .id(u.getId())
            .email(u.getEmail())
            .firstName(u.getFirstName())
            .lastName(u.getLastName())
            .role(u.getRole())
            .status(u.getStatus())
            .emailVerified(u.isEmailVerified())
            .profilePictureUrl(u.getProfilePictureUrl())
            .phoneNumber(u.getPhoneNumber())
            .createdAt(u.getCreatedAt())
            .notificationPreferences(u.getNotificationPreferences() != null ? u.getNotificationPreferences() : new HashMap<>())
            .location(loc)
            .deleted(u.isDeleted())
            .deletedAt(u.getDeletedAt())
            .deletionReason(u.getDeletionReason())
            .build();
    }
}
