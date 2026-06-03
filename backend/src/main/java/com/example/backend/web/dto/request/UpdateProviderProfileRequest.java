package com.example.backend.web.dto.request;

import com.example.backend.domain.user.ServiceCategory;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Set;

@Data
public class UpdateProviderProfileRequest {

    @NotBlank(message = "First name is required")
    @Size(max = 100)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 100)
    private String lastName;

    @Size(max = 50)
    private String phoneNumber;

    @NotBlank(message = "Street name is required")
    @Size(max = 255)
    private String locationStreetName;

    @Size(max = 20)
    private String locationStreetNumber;

    @NotBlank(message = "City is required")
    @Size(max = 100)
    private String locationCity;

    @Size(max = 20)
    private String locationPostalCode;

    @Size(max = 100)
    private String locationCountry;

    @NotNull(message = "Price per hour is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price per hour must be positive")
    @Digits(integer = 8, fraction = 2, message = "Price per hour must have at most 8 digits before the decimal point")
    private BigDecimal pricePerHour;

    @NotNull(message = "Years of experience is required")
    @Min(value = 0)
    @Max(value = 80)
    private Integer yearsOfExperience;

    @NotNull(message = "Service radius is required")
    @Min(value = 1, message = "Service radius must be at least 1 km")
    @Max(value = 500)
    private Integer serviceRadiusKm;

    @NotEmpty(message = "At least one service category is required")
    private Set<ServiceCategory> categories;

    @Size(max = 2000)
    private String bio;

    // ─── Payout / bank details (optional on save, but required to accept jobs) ──
    // We allow saving the profile with empty bank fields so providers can edit
    // other things without being forced to fill bank info every time. The
    // acceptTicket() service check is what actually enforces presence.

    @Size(max = 200)
    private String bankAccountHolder;

    @Size(max = 50)
    private String bankIban;

    @Size(max = 20)
    private String bankBic;

    @Size(max = 200)
    private String bankName;
}
