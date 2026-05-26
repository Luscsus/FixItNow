package com.example.backend.domain.review;

import com.example.backend.domain.user.Provider;
import com.example.backend.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A customer's review of a service provider.
 * <p>
 * One row per (reviewer, provider) — a customer can post at most one review per
 * provider, but they can edit it later. The unique constraint enforces that.
 */
@Entity
@Table(
    name = "reviews",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_review_reviewer_provider",
        columnNames = {"reviewer_id", "provider_id"}
    ),
    indexes = {
        @Index(name = "ix_review_provider", columnList = "provider_id"),
        @Index(name = "ix_review_reviewer", columnList = "reviewer_id"),
    }
)
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "provider_id", nullable = false)
    private Provider provider;

    /** Star rating, 1–5 inclusive. Enforced at the service layer. */
    @Column(nullable = false)
    private int rating;

    @Column(length = 2000)
    private String comment;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
