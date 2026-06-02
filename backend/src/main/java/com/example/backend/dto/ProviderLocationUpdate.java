package com.example.backend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * Inbound STOMP payload published by the provider's browser while driving to a
 * ticket. Sent to {@code /app/tracking.update}.
 */
@Getter
@Setter
public class ProviderLocationUpdate {

    @NotNull
    private Long ticketId;

    @NotNull
    @DecimalMin("-90.0")
    @DecimalMax("90.0")
    private Double lat;

    @NotNull
    @DecimalMin("-180.0")
    @DecimalMax("180.0")
    private Double lng;

    /** Optional GPS heading in degrees (0–360), if the device reports it. */
    private Double heading;
}
