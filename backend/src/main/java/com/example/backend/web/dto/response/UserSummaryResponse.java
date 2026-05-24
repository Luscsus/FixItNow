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
    private LocalDateTime createdAt;
    private Map<String, Boolean> notificationPreferences;

    public static UserSummaryResponse from(User u) {
        return UserSummaryResponse.builder()
            .id(u.getId())
            .email(u.getEmail())
            .firstName(u.getFirstName())
            .lastName(u.getLastName())
            .role(u.getRole())
            .status(u.getStatus())
            .emailVerified(u.isEmailVerified())
            .createdAt(u.getCreatedAt())
            .notificationPreferences(u.getNotificationPreferences() != null ? u.getNotificationPreferences() : new HashMap<>())
            .build();
    }
}
