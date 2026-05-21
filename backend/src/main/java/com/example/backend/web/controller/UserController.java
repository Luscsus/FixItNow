package com.example.backend.web.controller;

import com.example.backend.domain.user.Provider;
import com.example.backend.domain.user.User;
import com.example.backend.domain.user.UserStatus;
import com.example.backend.repository.ProviderRepository;
import com.example.backend.security.UserPrincipal;
import com.example.backend.web.dto.response.ProviderResponse;
import com.example.backend.web.dto.response.UserSummaryResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Current user", description = "Endpoints for the currently authenticated user's profile.")
public class UserController {

    private final ProviderRepository providerRepository;

    @Operation(summary = "Get the currently authenticated user's profile (any role).")
    @GetMapping("/users/me")
    public ResponseEntity<UserSummaryResponse> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        User user = principal.getUser();
        return ResponseEntity.ok(UserSummaryResponse.from(user));
    }

    @Operation(summary = "Get the currently authenticated provider's full profile.")
    @GetMapping("/providers/me")
    public ResponseEntity<ProviderResponse> getCurrentProvider(@AuthenticationPrincipal UserPrincipal principal) {
        User user = principal.getUser();
        if (!(user instanceof Provider provider)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(ProviderResponse.from(provider));
    }

    @Operation(summary = "List all active (approved) providers.")
    @GetMapping("/providers")
    public ResponseEntity<List<ProviderResponse>> listActiveProviders() {
        List<ProviderResponse> providers = providerRepository.findAllByStatus(UserStatus.ACTIVE)
            .stream()
            .map(ProviderResponse::from)
            .toList();
        return ResponseEntity.ok(providers);
    }
}
