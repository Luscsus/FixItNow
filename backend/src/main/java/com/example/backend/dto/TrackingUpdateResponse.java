package com.example.backend.dto;

import java.time.LocalDateTime;

/**
 * Live tracking snapshot pushed to the customer on {@code /topic/tracking/{ticketId}}
 * (and returned by the REST "last known" endpoint).
 *
 * @param ticketId        the ticket being tracked
 * @param providerLat     provider's current latitude (null if not yet sharing)
 * @param providerLng     provider's current longitude
 * @param heading         GPS heading in degrees, if available
 * @param destLat         destination (customer) latitude
 * @param destLng         destination (customer) longitude
 * @param destAddress     human-readable destination address (shown to the provider)
 * @param distanceMeters  driving distance remaining, metres (null if unavailable)
 * @param etaSeconds      estimated driving time remaining, seconds (null if unavailable)
 * @param nearby          true once the provider is within the proximity threshold
 * @param updatedAt       when this position was reported
 */
public record TrackingUpdateResponse(
    Long ticketId,
    Double providerLat,
    Double providerLng,
    Double heading,
    Double destLat,
    Double destLng,
    String destAddress,
    Double distanceMeters,
    Double etaSeconds,
    boolean nearby,
    LocalDateTime updatedAt
) {}
