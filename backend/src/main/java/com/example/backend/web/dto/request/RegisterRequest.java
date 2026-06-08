package com.example.backend.web.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    /**
     * Shared phone-number pattern: optional leading "+", then 6–20 digits with
     * common separators. An empty string is allowed so the field stays optional.
     */
    public static final String PHONE_PATTERN = "^$|^\\+?[0-9 ()./\\-]{6,20}$";

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    private String password;

    @NotBlank(message = "First name is required")
    @Size(max = 100, message = "First name must not exceed 100 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 100, message = "Last name must not exceed 100 characters")
    private String lastName;

    /** Optional contact phone number. Customers can add it now or later in settings. */
    @Size(max = 50, message = "Phone number must not exceed 50 characters")
    @Pattern(regexp = PHONE_PATTERN, message = "Invalid phone number")
    private String phoneNumber;
}
