package com.example.backend.web.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DeclineProviderRequest {

    @NotBlank(message = "Rejection reason is required")
    @Size(max = 1000)
    private String reason;
}
