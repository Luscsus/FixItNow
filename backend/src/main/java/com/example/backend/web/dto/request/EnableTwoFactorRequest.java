package com.example.backend.web.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EnableTwoFactorRequest {

    @NotBlank(message = "Verification code is required")
    private String code;
}
