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

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0")
    @DecimalMax(value = "90.0")
    private BigDecimal locationLat;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0")
    @DecimalMax(value = "180.0")
    private BigDecimal locationLon;

    @NotNull(message = "Price per hour is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price per hour must be positive")
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
}
