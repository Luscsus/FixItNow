package com.example.backend.web.controller;

import com.example.backend.dto.ConnectStatusResponse;
import com.example.backend.security.UserPrincipal;
import com.example.backend.service.ConnectService;
import com.example.backend.web.dto.response.CheckoutSessionResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Stripe Connect onboarding endpoints for providers. The customer-facing payment
 * endpoints live in {@link PaymentController}; this is the provider-side payout setup.
 */
@RestController
@RequestMapping("/api/connect")
public class ConnectController {

    private final ConnectService connectService;

    public ConnectController(ConnectService connectService) {
        this.connectService = connectService;
    }

    /** Starts (or resumes) Stripe-hosted onboarding; returns the redirect URL. */
    @PostMapping("/onboarding-link")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<CheckoutSessionResponse> createOnboardingLink(
        @AuthenticationPrincipal UserPrincipal userDetails
    ) {
        String url = connectService.createOnboardingLink(userDetails.getUser().getId());
        return ResponseEntity.ok(new CheckoutSessionResponse(url));
    }

    /** Current onboarding state from the locally-cached flags. */
    @GetMapping("/status")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<ConnectStatusResponse> getStatus(
        @AuthenticationPrincipal UserPrincipal userDetails
    ) {
        return ResponseEntity.ok(connectService.getStatus(userDetails.getUser().getId()));
    }

    /** Forces a refresh from Stripe (used when returning from onboarding). */
    @PostMapping("/refresh")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<ConnectStatusResponse> refresh(
        @AuthenticationPrincipal UserPrincipal userDetails
    ) {
        return ResponseEntity.ok(connectService.refreshStatus(userDetails.getUser().getId()));
    }
}
