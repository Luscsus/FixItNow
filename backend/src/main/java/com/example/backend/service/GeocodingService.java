package com.example.backend.service;

import java.util.List;
import java.util.Optional;

public interface GeocodingService {

    /**
     * Resolves geographic coordinates for the given structured address.
     *
     * @return an array [latitude, longitude], or empty if the address could not be resolved
     */
    Optional<double[]> geocode(String streetName, String streetNumber,
                               String city, String postalCode, String country);

    /** A single address suggestion for autocomplete. */
    record AddressSuggestion(String displayName, double lat, double lng) {}

    /**
     * Free-form address search for autocomplete. Returns up to {@code limit}
     * ranked matches for the typed query (e.g. "Pod Vinogradi 18, Maribor").
     */
    List<AddressSuggestion> search(String query, int limit);
}
