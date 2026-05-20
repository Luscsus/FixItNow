package com.example.backend.web.dto.request;

import com.example.backend.domain.user.ServiceCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Set;

@Data
public class ProviderSearchParams {

    private Set<ServiceCategory> categories;

    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal minPrice;

    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal maxPrice;

    @Min(0)
    private Integer minYearsOfExperience;

    @Min(-90) @Max(90)
    private Double latitude;

    @Min(-180) @Max(180)
    private Double longitude;

    /** Search radius in km — required when latitude/longitude are provided. */
    @DecimalMin(value = "0.0", inclusive = false)
    private Double radiusKm;

    @Min(0)
    private int page = 0;

    @Min(1) @Max(1000)
    private int size = 20;
}
