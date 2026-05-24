package com.example.backend.domain.user;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "saved_providers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedProvider {

    @EmbeddedId
    private SavedProviderId id;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SavedProviderId implements Serializable {

        @Column(name = "user_id", nullable = false)
        private UUID userId;

        @Column(name = "provider_id", nullable = false)
        private UUID providerId;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof SavedProviderId that)) return false;
            return Objects.equals(userId, that.userId) && Objects.equals(providerId, that.providerId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, providerId);
        }
    }
}
