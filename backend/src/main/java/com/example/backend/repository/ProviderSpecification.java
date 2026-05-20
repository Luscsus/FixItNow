package com.example.backend.repository;

import com.example.backend.domain.user.Provider;
import com.example.backend.domain.user.ServiceCategory;
import com.example.backend.domain.user.UserStatus;
import jakarta.persistence.criteria.Expression;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.Set;

public final class ProviderSpecification {

    private ProviderSpecification() {}

    public static Specification<Provider> isActive() {
        return (root, query, cb) -> cb.equal(root.get("status"), UserStatus.ACTIVE);
    }

    public static Specification<Provider> hasAnyCategory(Set<ServiceCategory> categories) {
        if (categories == null || categories.isEmpty()) return null;
        return (root, query, cb) -> {
            // providers whose categories collection intersects with the requested set
            query.distinct(true);
            return root.join("categories").in(categories);
        };
    }

    public static Specification<Provider> minPrice(BigDecimal min) {
        if (min == null) return null;
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("pricePerHour"), min);
    }

    public static Specification<Provider> maxPrice(BigDecimal max) {
        if (max == null) return null;
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("pricePerHour"), max);
    }

    public static Specification<Provider> minYearsOfExperience(Integer min) {
        if (min == null) return null;
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("yearsOfExperience"), min);
    }

    /**
     * Haversine distance filter using standard SQL math functions (sin, cos, acos, radians).
     * Excludes providers with null coordinates.
     */
    public static Specification<Provider> withinRadius(Double lat, Double lon, Double radiusKm) {
        if (lat == null || lon == null || radiusKm == null) return null;
        return (root, query, cb) -> {
            Expression<Double> providerLat = root.<BigDecimal>get("locationLat").as(Double.class);
            Expression<Double> providerLon = root.<BigDecimal>get("locationLon").as(Double.class);

            Expression<Double> providerLatRad = cb.function("radians", Double.class, providerLat);
            Expression<Double> providerLonRad = cb.function("radians", Double.class, providerLon);
            Expression<Double> targetLatRad = cb.function("radians", Double.class, cb.literal(lat));
            Expression<Double> targetLonRad = cb.function("radians", Double.class, cb.literal(lon));

            // cos(targetLat) * cos(providerLat) * cos(providerLon - targetLon)
            Expression<Double> cosLats = cb.prod(
                cb.function("cos", Double.class, targetLatRad),
                cb.function("cos", Double.class, providerLatRad)
            );
            Expression<Double> cosLonDiff = cb.function("cos", Double.class,
                cb.diff(providerLonRad, targetLonRad)
            );
            Expression<Double> cosProduct = cb.prod(cosLats, cosLonDiff);

            // sin(targetLat) * sin(providerLat)
            Expression<Double> sinProduct = cb.prod(
                cb.function("sin", Double.class, targetLatRad),
                cb.function("sin", Double.class, providerLatRad)
            );

            Expression<Double> acosArg = cb.sum(cosProduct, sinProduct);
            Expression<Double> distance = cb.prod(
                cb.literal(6371.0),
                cb.function("acos", Double.class, acosArg)
            );

            return cb.and(
                cb.isNotNull(root.get("locationLat")),
                cb.isNotNull(root.get("locationLon")),
                cb.lessThanOrEqualTo(distance, cb.literal(radiusKm))
            );
        };
    }
}
