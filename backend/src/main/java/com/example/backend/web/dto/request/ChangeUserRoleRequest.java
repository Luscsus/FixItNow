package com.example.backend.web.dto.request;

import com.example.backend.domain.user.UserRole;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChangeUserRoleRequest {

    @NotNull(message = "Role is required")
    private UserRole role;
}
