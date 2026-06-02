package com.example.backend.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Optional;

@Service
@Slf4j
public class NominatimGeocodingService implements GeocodingService {

    private static final String BASE_URL = "https://nominatim.openstreetmap.org";
    private static final String USER_AGENT = "FixItNow/1.0";

    private final RestClient restClient;

    public NominatimGeocodingService() {
        this.restClient = RestClient.builder()
                .baseUrl(BASE_URL)
                .defaultHeader("User-Agent", USER_AGENT)
                .defaultHeader("Accept-Language", "en")
                .build();
    }

    @Override
    public Optional<double[]> geocode(String streetName, String streetNumber,
                                      String city, String postalCode, String country) {
        String street = buildStreetParam(streetName, streetNumber);

        UriComponentsBuilder uri = UriComponentsBuilder.fromPath("/search")
                .queryParam("format", "json")
                .queryParam("limit", 1);

        if (street != null && !street.isBlank())      uri.queryParam("street", street);
        if (city != null && !city.isBlank())           uri.queryParam("city", city);
        if (postalCode != null && !postalCode.isBlank()) uri.queryParam("postalcode", postalCode);
        if (country != null && !country.isBlank())    uri.queryParam("country", country);

        try {
            NominatimResult[] results = restClient.get()
                    .uri(uri.build().toUriString())
                    .retrieve()
                    .body(NominatimResult[].class);

            if (results == null || results.length == 0) {
                log.warn("Nominatim returned no results for: street='{}', city='{}', postalCode='{}', country='{}'",
                        street, city, postalCode, country);
                return Optional.empty();
            }

            double lat = Double.parseDouble(results[0].lat());
            double lon = Double.parseDouble(results[0].lon());
            log.debug("Geocoded '{}', '{}' → [{}, {}]", street, city, lat, lon);
            return Optional.of(new double[]{lat, lon});

        } catch (Exception e) {
            log.error("Nominatim geocoding request failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public java.util.List<AddressSuggestion> search(String query, int limit) {
        if (query == null || query.isBlank()) {
            return java.util.List.of();
        }
        String uri = UriComponentsBuilder.fromPath("/search")
            .queryParam("format", "json")
            .queryParam("addressdetails", 0)
            .queryParam("limit", Math.max(1, Math.min(limit, 8)))
            .queryParam("q", query.trim())
            .build()
            .toUriString();

        try {
            NominatimSearchResult[] results = restClient.get()
                .uri(uri)
                .retrieve()
                .body(NominatimSearchResult[].class);

            if (results == null) return java.util.List.of();
            java.util.List<AddressSuggestion> out = new java.util.ArrayList<>(results.length);
            for (NominatimSearchResult r : results) {
                try {
                    out.add(new AddressSuggestion(
                        r.display_name(),
                        Double.parseDouble(r.lat()),
                        Double.parseDouble(r.lon())));
                } catch (NumberFormatException ignored) { /* skip malformed row */ }
            }
            return out;
        } catch (Exception e) {
            log.warn("Nominatim search failed for '{}': {}", query, e.getMessage());
            return java.util.List.of();
        }
    }

    private String buildStreetParam(String streetName, String streetNumber) {
        if (streetName == null || streetName.isBlank()) return null;
        if (streetNumber != null && !streetNumber.isBlank()) {
            return streetNumber + " " + streetName;
        }
        return streetName;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record NominatimResult(String lat, String lon) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record NominatimSearchResult(String lat, String lon, String display_name) {}
}
