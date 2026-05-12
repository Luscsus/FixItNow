package com.example.backend.web.controller;

import com.example.backend.security.UserPrincipal;
import com.example.backend.service.AuthService;
import com.example.backend.web.dto.request.EnableTwoFactorRequest;
import com.example.backend.web.dto.request.TwoFactorVerifyRequest;
import com.example.backend.web.dto.response.MessageResponse;
import com.example.backend.web.dto.response.TwoFactorSetupResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/user/2fa")
@RequiredArgsConstructor
@Tag(name = "Two-Factor Authentication", description = "Manage TOTP-based 2FA for the authenticated user")
public class TwoFactorController {

    private final AuthService authService;

    @Operation(summary = "Initiate 2FA setup", description = "Generates a TOTP secret and returns the otpauth:// URI for QR code display. Call /enable next to confirm")
    @PostMapping("/setup")
    public ResponseEntity<TwoFactorSetupResponse> setup(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(authService.setupTwoFactor(principal.getUsername()));
    }

    @Operation(summary = "Enable 2FA", description = "Confirms setup by verifying the first TOTP code from the authenticator app")
    @PostMapping("/enable")
    public ResponseEntity<MessageResponse> enable(
        @Valid @RequestBody EnableTwoFactorRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(authService.enableTwoFactor(request, principal.getUsername()));
    }

    @Operation(summary = "Disable 2FA", description = "Disables 2FA after verifying the current TOTP code")
    @PostMapping("/disable")
    public ResponseEntity<MessageResponse> disable(
        @Valid @RequestBody TwoFactorVerifyRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(authService.disableTwoFactor(request, principal.getUsername()));
    }
}
