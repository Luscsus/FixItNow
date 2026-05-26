package com.example.backend.web.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

@Data
public class UpdateNotificationPreferencesRequest {

    @NotNull
    private Map<String, Boolean> preferences;
}
