package com.example.backend.common;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GeoUtilsTest {

    private static final double TOLERANCE_METERS = 5.0;

    @Test
    void samePointShouldReturnZero() {
        double dist = GeoUtils.haversineMeters(46.0, 14.0, 46.0, 14.0);
        assertEquals(0.0, dist, TOLERANCE_METERS);
    }

    @Test
    void knownDistanceLjubljanaMariborShouldBeApprox110km() {
        // Ljubljana: 46.0569, 14.5058 — Maribor: 46.5547, 15.6467
        double dist = GeoUtils.haversineMeters(46.0569, 14.5058, 46.5547, 15.6467);
        // ~110 km straight line
        assertTrue(dist > 100_000 && dist < 120_000,
            "Expected ~110 km, got " + dist / 1000 + " km");
    }

    @Test
    void knownDistanceShouldBeSymmetric() {
        double d1 = GeoUtils.haversineMeters(46.0, 14.0, 47.0, 15.0);
        double d2 = GeoUtils.haversineMeters(47.0, 15.0, 46.0, 14.0);
        assertEquals(d1, d2, TOLERANCE_METERS);
    }

    @Test
    void shortDistanceShouldBeAccurate() {
        // Two points roughly 1 km apart (north-south near equator)
        // 1 degree latitude ≈ 111 km, so 0.009° ≈ 1 km
        double dist = GeoUtils.haversineMeters(0.0, 0.0, 0.009, 0.0);
        assertTrue(dist > 900 && dist < 1100, "Expected ~1 km, got " + dist + " m");
    }

    @Test
    void antipodeShouldBeHalfEarthCircumference() {
        // Antipodal points — half the great circle of Earth (~20015 km)
        double dist = GeoUtils.haversineMeters(0.0, 0.0, 0.0, 180.0);
        assertTrue(dist > 19_900_000 && dist < 20_200_000,
            "Expected ~20 015 km, got " + dist / 1000 + " km");
    }

    @Test
    void crossEquatorAndMeridianShouldWork() {
        double dist = GeoUtils.haversineMeters(-10.0, -20.0, 10.0, 20.0);
        assertTrue(dist > 0);
    }
}
