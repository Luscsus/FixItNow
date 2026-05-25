package com.example.backend.service;

import java.util.Optional;

public interface GeocodingService {

    /**
     * Resolves geographic coordinates for the given structured address.
     *
     * @return an array [latitude, longitude], or empty if the address could not be resolved
     */
    Optional<double[]> geocode(String streetName, String streetNumber,
                               String city, String postalCode, String country);
}
