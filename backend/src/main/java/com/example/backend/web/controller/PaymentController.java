package com.example.backend.web.controller;

import com.example.backend.dto.TicketResponse;
import com.example.backend.security.UserPrincipal;
import com.example.backend.service.PaymentService;
import com.example.backend.web.dto.response.CheckoutSessionResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

/**
 * Stripe invoice payments. Two customer-facing endpoints live under
 * /api/tickets, and the Stripe webhook lives at /api/payments/webhook (public,
 * authenticated by signature rather than JWT — see SecurityConfig).
 */
@RestController
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /** Creates a Stripe Checkout session for this ticket's invoice and returns the redirect URL. */
    @PostMapping("/api/tickets/{ticketId}/checkout-session")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CheckoutSessionResponse> createCheckoutSession(
        @PathVariable Long ticketId,
        @AuthenticationPrincipal UserPrincipal userDetails
    ) {
        String url = paymentService.createCheckoutSession(ticketId, userDetails.getUser().getId());
        return ResponseEntity.ok(new CheckoutSessionResponse(url));
    }

    /** Confirms payment when the browser returns from Stripe; returns the updated ticket. */
    @PostMapping("/api/tickets/{ticketId}/payment/confirm")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TicketResponse> confirmPayment(
        @PathVariable Long ticketId,
        @AuthenticationPrincipal UserPrincipal userDetails
    ) {
        return ResponseEntity.ok(paymentService.confirmPayment(ticketId, userDetails.getUser().getId()));
    }

    /** Stripe webhook receiver. Verifies the signature and advances paid tickets to COMPLETED. */
    @PostMapping("/api/payments/webhook")
    public ResponseEntity<String> handleWebhook(
        @RequestBody String payload,
        @RequestHeader("Stripe-Signature") String signature
    ) {
        paymentService.handleWebhook(payload, signature);
        return ResponseEntity.ok("ok");
    }
}
