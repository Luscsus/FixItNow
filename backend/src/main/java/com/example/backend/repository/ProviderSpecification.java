package com.example.backend.repository;

import com.example.backend.domain.user.Provider;
import com.example.backend.domain.user.ServiceCategory;
import com.example.backend.domain.user.UserStatus;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.util.Set;
import java.util.UUID;

public final class ProviderSpecification {

    private ProviderSpecification() {}

    public static Specification<Provider> isActive() {
        return (root, query, cb) -> cb.equal(root.get("status"), UserStatus.ACTIVE);
    }

    public static Specification<Provider> hasAnyCategory(Set<ServiceCategory> categories) {
        if (categories == null || categories.isEmpty()) return null;
        return (root, query, cb) -> {
            // Use a subquery so the outer COUNT query stays simple and returns correct totals.
            // A direct JOIN + distinct(true) corrupts the Spring Data pagination count query.
            Subquery<UUID> sub = query.subquery(UUID.class);
            var subRoot = sub.from(Provider.class);
            sub.select(subRoot.get("id"))
               .where(subRoot.join("categories").in(categories));
            return root.get("id").in(sub);
        };
    }

    /**
     * Free-text match across the provider's first/last name, full name, bio, and
     * trade category names (e.g. "marko", "plumb", "plumbing" all work). Returns
     * null (no-op) when the query is blank.
     */
    public static Specification<Provider> matchesQuery(String query) {
        if (query == null || query.isBlank()) return null;
        String like = "%" + query.trim().toLowerCase() + "%";
        return (root, criteriaQuery, cb) -> {
            Expression<String> first = cb.lower(root.get("firstName"));
            Expression<String> last = cb.lower(root.get("lastName"));
            Expression<String> full = cb.lower(cb.concat(cb.concat(root.get("firstName"), cb.literal(" ")), root.get("lastName")));
            Expression<String> bio = cb.lower(root.get("bio"));

            // Category enum-name match via a subquery so pagination counts stay correct.
            Subquery<UUID> catSub = criteriaQuery.subquery(UUID.class);
            var catRoot = catSub.from(Provider.class);
            var catJoin = catRoot.join("categories");
            catSub.select(catRoot.get("id"))
                  .where(cb.like(cb.lower(catJoin.as(String.class)), like));

            return cb.or(
                cb.like(first, like),
                cb.like(last, like),
                cb.like(full, like),
                cb.like(bio, like),
                root.get("id").in(catSub)
            );
        };
    }

    public static Specification<Provider> minPrice(java.math.BigDecimal min) {
        if (min == null) return null;
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("pricePerHour"), min);
    }

    public static Specification<Provider> maxPrice(java.math.BigDecimal max) {
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
            var locationJoin = root.join("location", JoinType.LEFT);
            Expression<Double> providerLat = locationJoin.get("latitude");
            Expression<Double> providerLon = locationJoin.get("longitude");

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
                cb.isNotNull(root.get("location")),
                cb.isNotNull(locationJoin.get("latitude")),
                cb.isNotNull(locationJoin.get("longitude")),
                cb.lessThanOrEqualTo(distance, cb.literal(radiusKm))
            );
        };
    }
}
