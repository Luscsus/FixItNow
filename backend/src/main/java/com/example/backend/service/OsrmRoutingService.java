package com.example.backend.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Driving routes via OSRM (Open Source Routing Machine). Defaults to the public
 * demo server, overridable with {@code app.osrm.base-url} (recommended to
 * self-host for production — the demo server is rate-limited and best-effort).
 * <p>
 * Mirrors {@link NominatimGeocodingService}: a dedicated {@link RestClient},
 * defensive parsing, and never throws — callers fall back to straight-line.
 */
@Service
@Slf4j
public class OsrmRoutingService implements RoutingService {

    private final RestClient restClient;

    public OsrmRoutingService(
        @Value("${app.osrm.base-url:https://router.project-osrm.org}") String baseUrl
    ) {
        this.restClient = RestClient.builder()
            .baseUrl(baseUrl)
            .defaultHeader("User-Agent", "FixItNow/1.0")
            .build();
    }

    @Override
    public Optional<RouteResult> route(double fromLat, double fromLng, double toLat, double toLng) {
        // OSRM expects coordinates as lon,lat (note the order) separated by ';'.
        // overview=false → we only want distance/duration, not the geometry.
        String path = String.format(
            Locale.US,
            "/route/v1/driving/%f,%f;%f,%f?overview=false&alternatives=false&steps=false",
            fromLng, fromLat, toLng, toLat
        );

        try {
            OsrmResponse resp = restClient.get()
                .uri(path)
                .retrieve()
                .body(OsrmResponse.class);

            if (resp == null || resp.routes() == null || resp.routes().isEmpty()) {
                log.warn("OSRM returned no route for [{},{}] -> [{},{}]", fromLat, fromLng, toLat, toLng);
                return Optional.empty();
            }
            OsrmRoute r = resp.routes().get(0);
            return Optional.of(new RouteResult(r.distance(), r.duration()));
        } catch (Exception e) {
            log.warn("OSRM routing request failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record OsrmResponse(List<OsrmRoute> routes) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record OsrmRoute(double distance, double duration) {}
}
