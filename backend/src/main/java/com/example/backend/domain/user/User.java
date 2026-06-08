package com.example.backend.domain.user;

import com.example.backend.domain.location.Location;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "users")
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "user_type", discriminatorType = DiscriminatorType.STRING)
@DiscriminatorValue("USER")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(unique = true, nullable = false, length = 255)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 100)
    private String firstName;

    @Column(nullable = false, length = 100)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private UserRole role = UserRole.CUSTOMER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private UserStatus status = UserStatus.PENDING_VERIFICATION;

    @Column(nullable = false)
    @Builder.Default
    private boolean emailVerified = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean twoFactorEnabled = false;

    @Column(length = 100)
    private String twoFactorSecret;

    @Column(name = "google_id", unique = true, length = 255)
    private String googleId;

    @Column(name = "profile_picture_url", length = 1024)
    private String profilePictureUrl;

    /**
     * Optional contact phone number (E.164-ish, free-format up to 50 chars).
     * Lives on the base user so both customers and providers share one column;
     * providers see a customer's number on their assigned tickets so they can
     * coordinate the appointment directly.
     */
    @Column(name = "phone_number", length = 50)
    private String phoneNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private Location location;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "notification_preferences", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Boolean> notificationPreferences = new HashMap<>();

    // ─── Soft delete (accounts are never hard-deleted) ──────────────────────
    @Column(nullable = false)
    @Builder.Default
    private boolean deleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /** Who performed the deletion (the user themselves, or an admin). */
    @Column(name = "deleted_by")
    private UUID deletedBy;

    /** Future use — reason captured at deletion time. */
    @Column(name = "deletion_reason", length = 500)
    private String deletionReason;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /** Display name that masks deleted accounts on record-keeping surfaces. */
    @Transient
    public String displayName() {
        if (deleted) {
            return role == UserRole.PROVIDER ? "Deleted User" : "Former Customer";
        }
        String full = ((firstName != null ? firstName : "") + " "
            + (lastName != null ? lastName : "")).trim();
        return full.isBlank() ? email : full;
    }
}
