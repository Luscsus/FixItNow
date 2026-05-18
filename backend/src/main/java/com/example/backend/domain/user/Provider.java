package com.example.backend.domain.user;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "providers")
@DiscriminatorValue("PROVIDER")
@PrimaryKeyJoinColumn(name = "id")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Provider extends User {

    @Column(name = "location_lat", precision = 10, scale = 7)
    private BigDecimal locationLat;

    @Column(name = "location_lon", precision = 10, scale = 7)
    private BigDecimal locationLon;

    @Column(name = "price_per_hour", precision = 10, scale = 2)
    private BigDecimal pricePerHour;

    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;

    @Column(name = "service_radius_km")
    private Integer serviceRadiusKm;

    @Column(length = 2000)
    private String bio;

    @Column(length = 50)
    private String phoneNumber;

    @ElementCollection(targetClass = ServiceCategory.class, fetch = FetchType.EAGER)
    @CollectionTable(
        name = "provider_categories",
        joinColumns = @JoinColumn(name = "provider_id")
    )
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    @Builder.Default
    private Set<ServiceCategory> categories = new HashSet<>();

    @Column(name = "approved_at")
    private java.time.LocalDateTime approvedAt;

    @Column(name = "approved_by")
    private java.util.UUID approvedBy;

    @Column(name = "rejection_reason", length = 1000)
    private String rejectionReason;
}
