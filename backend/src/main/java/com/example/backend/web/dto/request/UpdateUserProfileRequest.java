package com.example.backend.web.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUserProfileRequest {

    @NotBlank(message = "First name is required")
    @Size(max = 100)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 100)
    private String lastName;

    /** Optional contact phone number. Empty/blank clears it. */
    @Size(max = 50, message = "Phone number must not exceed 50 characters")
    @Pattern(regexp = RegisterRequest.PHONE_PATTERN, message = "Invalid phone number")
    private String phoneNumber;
}
