package com.example.backend.web.controller;

import com.example.backend.service.AuthService;
import com.example.backend.web.dto.request.*;
import com.example.backend.web.dto.response.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, login, email confirmation, password reset, and token management")
@SecurityRequirements
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Register a new customer", description = "Creates a customer account (role=CUSTOMER) and sends an email confirmation link.")
    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @Operation(
        summary = "Register a new provider",
        description = "Submits a provider application (role=PROVIDER, status=PENDING_APPROVAL). " +
            "An email is sent to the applicant confirming the pending status, and an email is sent to all administrators " +
            "notifying them of the new approval request. The provider cannot log in until an admin approves their application."
    )
    @PostMapping("/register/provider")
    public ResponseEntity<MessageResponse> registerProvider(@Valid @RequestBody ProviderRegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerProvider(request));
    }

    @Operation(summary = "Login", description = "Returns tokens on success. If 2FA is enabled, returns requiresTwoFactor=true and a short-lived tempToken instead")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @Operation(summary = "Sign in with Google", description = "Exchanges a Google OAuth access token for application JWT tokens. Creates an account if the email is not yet registered.")
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(authService.googleLogin(request));
    }

    @Operation(summary = "Complete 2FA login", description = "Exchange the tempToken + TOTP code for full access and refresh tokens")
    @PostMapping("/2fa/verify")
    public ResponseEntity<AuthResponse> verifyTwoFactor(@Valid @RequestBody TwoFactorVerifyRequest request) {
        return ResponseEntity.ok(authService.verifyTwoFactor(request));
    }

    @Operation(summary = "Confirm email address", description = "Activates the account using the token sent by email")
    @GetMapping("/confirm-email")
    public ResponseEntity<MessageResponse> confirmEmail(@RequestParam String token) {
        return ResponseEntity.ok(authService.confirmEmail(token));
    }

    @Operation(summary = "Resend email confirmation", description = "Sends a new confirmation link if the account exists and is not yet verified (always returns 200 to prevent enumeration)")
    @PostMapping("/resend-confirmation")
    public ResponseEntity<MessageResponse> resendEmailConfirmation(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.resendEmailConfirmation(request));
    }

    @Operation(summary = "Request password reset", description = "Sends a password reset link to the email if it exists (always returns 200 to prevent enumeration)")
    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    @Operation(summary = "Reset password", description = "Sets a new password using the token from the reset email. Revokes all existing refresh tokens")
    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }

    @Operation(summary = "Refresh access token", description = "Issues a new access + refresh token pair. The used refresh token is revoked")
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    @Operation(summary = "Logout", description = "Revokes the provided refresh token")
    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.logout(request.getRefreshToken()));
    }
}
