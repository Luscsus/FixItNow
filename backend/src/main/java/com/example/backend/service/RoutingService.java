package com.example.backend.service;

import java.util.Optional;

/** Driving-route distance + duration between two coordinates. */
public interface RoutingService {

    /** A computed driving route: straight metres and seconds along roads. */
    record RouteResult(double distanceMeters, double durationSeconds) {}

    /**
     * Driving route from origin → destination. Returns empty when the routing
     * provider is unreachable or returns no route, so callers can fall back to
     * a straight-line estimate.
     */
    Optional<RouteResult> route(double fromLat, double fromLng, double toLat, double toLng);
}
