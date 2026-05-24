package com.example.backend.web.controller;

import com.example.backend.common.exception.ApiException;
import com.example.backend.domain.user.Provider;
import com.example.backend.domain.user.User;
import com.example.backend.repository.ProviderRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.UserPrincipal;
import com.example.backend.web.dto.request.ChangePasswordRequest;
import com.example.backend.web.dto.request.UpdateNotificationPreferencesRequest;
import com.example.backend.web.dto.request.UpdateProviderProfileRequest;
import com.example.backend.web.dto.request.UpdateUserProfileRequest;
import com.example.backend.web.dto.response.MessageResponse;
import com.example.backend.web.dto.response.ProviderResponse;
import com.example.backend.web.dto.response.UserSummaryResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Current user", description = "Endpoints for the currently authenticated user's profile.")
public class UserController {

    private final UserRepository userRepository;
    private final ProviderRepository providerRepository;
    private final PasswordEncoder passwordEncoder;

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

    @Operation(summary = "Update the current user's basic profile (first name, last name).")
    @PatchMapping("/users/me")
    @Transactional
    public ResponseEntity<UserSummaryResponse> updateCurrentUser(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody UpdateUserProfileRequest request
    ) {
        User user = userRepository.findById(principal.getUser().getId())
            .orElseThrow(() -> new ApiException("User not found"));
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        userRepository.save(user);
        return ResponseEntity.ok(UserSummaryResponse.from(user));
    }

    @Operation(summary = "Update the current provider's business profile.")
    @PatchMapping("/providers/me")
    @Transactional
    public ResponseEntity<ProviderResponse> updateCurrentProvider(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody UpdateProviderProfileRequest request
    ) {
        User user = principal.getUser();
        if (!(user instanceof Provider)) {
            return ResponseEntity.status(403).build();
        }
        Provider provider = providerRepository.findById(user.getId())
            .orElseThrow(() -> new ApiException("Provider not found"));
        provider.setFirstName(request.getFirstName().trim());
        provider.setLastName(request.getLastName().trim());
        provider.setPhoneNumber(request.getPhoneNumber());
        provider.setLocationLat(request.getLocationLat());
        provider.setLocationLon(request.getLocationLon());
        provider.setPricePerHour(request.getPricePerHour());
        provider.setYearsOfExperience(request.getYearsOfExperience());
        provider.setServiceRadiusKm(request.getServiceRadiusKm());
        provider.setCategories(request.getCategories());
        provider.setBio(request.getBio());
        providerRepository.save(provider);
        return ResponseEntity.ok(ProviderResponse.from(provider));
    }

    @Operation(summary = "Change the current user's password.")
    @PatchMapping("/users/me/password")
    @Transactional
    public ResponseEntity<MessageResponse> changePassword(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody ChangePasswordRequest request
    ) {
        User user = userRepository.findById(principal.getUser().getId())
            .orElseThrow(() -> new ApiException("User not found"));
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new ApiException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return ResponseEntity.ok(new MessageResponse("Password updated"));
    }

    @Operation(summary = "Update the current user's notification preferences.")
    @PatchMapping("/users/me/notification-preferences")
    @Transactional
    public ResponseEntity<UserSummaryResponse> updateNotificationPreferences(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody UpdateNotificationPreferencesRequest request
    ) {
        User user = userRepository.findById(principal.getUser().getId())
            .orElseThrow(() -> new ApiException("User not found"));
        user.setNotificationPreferences(new HashMap<>(request.getPreferences()));
        userRepository.save(user);
        return ResponseEntity.ok(UserSummaryResponse.from(user));
    }
}
