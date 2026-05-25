package com.example.backend.web.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfilePictureRequest {

    @NotBlank(message = "URL is required")
    @Size(max = 1024, message = "URL is too long")
    private String url;
}
