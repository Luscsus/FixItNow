package com.example.backend.service;

import com.example.backend.common.exception.ApiException;
import com.example.backend.domain.ticket.Ticket;
import com.example.backend.domain.ticket.TicketStatus;
import com.example.backend.dto.TicketResponse;
import com.example.backend.exception.TicketNotFoundException;
import com.example.backend.repository.TicketRepository;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

/**
 * Stripe-backed invoice payments. The customer is redirected to a hosted Stripe
 * Checkout page; once payment clears the ticket advances PENDING_PAYMENT → COMPLETED.
 *
 * Two paths converge on {@link TicketService#markTicketPaid}:
 *   1. The {@code checkout.session.completed} webhook — authoritative, async.
 *   2. {@link #confirmPayment} — called when the browser returns to the success
 *      URL, so the ticket updates promptly even when no webhook is wired up
 *      (e.g. local dev without `stripe listen`).
 * {@code markTicketPaid} is idempotent, so the two racing is harmless.
 */
@Service
public class PaymentService {

    private final TicketRepository ticketRepository;
    private final TicketService ticketService;
    private final String frontendUrl;
    private final String currency;
    private final String webhookSecret;
    private final boolean enabled;

    public PaymentService(TicketRepository ticketRepository,
                          TicketService ticketService,
                          @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl,
                          @Value("${stripe.currency:usd}") String currency,
                          @Value("${stripe.secret-key:}") String secretKey,
                          @Value("${stripe.webhook-secret:}") String webhookSecret) {
        this.ticketRepository = ticketRepository;
        this.ticketService = ticketService;
        this.frontendUrl = frontendUrl;
        this.currency = currency;
        this.webhookSecret = webhookSecret;
        this.enabled = secretKey != null && !secretKey.isBlank();
    }

    /**
     * Creates a Stripe Checkout session for the ticket's outstanding invoice and
     * returns the hosted payment URL the frontend should redirect to. Only the
     * ticket owner may pay, and only while the ticket is awaiting payment.
     */
    @Transactional
    public String createCheckoutSession(Long ticketId, UUID userId) {
        if (!enabled) {
            throw new ApiException("Payments are not configured. Set STRIPE_SECRET_KEY to enable Stripe.");
        }
        Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new TicketNotFoundException("Ticket not found: " + ticketId));

        if (ticket.getUser() == null || !ticket.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Only the ticket owner can pay this invoice.");
        }
        if (ticket.getStatus() != TicketStatus.PENDING_PAYMENT) {
            throw new ApiException("This ticket is not awaiting payment (status: " + ticket.getStatus() + ").");
        }
        BigDecimal amount = ticket.getEstimatedCost();
        if (amount == null || amount.signum() <= 0) {
            throw new ApiException("This ticket has no invoice amount to pay.");
        }

        String code = String.format("FIX-%04d", ticket.getId());
        long unitAmount = amount.setScale(2, RoundingMode.HALF_UP).movePointRight(2).longValueExact();
        String returnBase = frontendUrl + "/tickets/" + ticket.getId();

        SessionCreateParams.Builder builder = SessionCreateParams.builder()
            .setMode(SessionCreateParams.Mode.PAYMENT)
            .setSuccessUrl(returnBase + "?payment=success&session_id={CHECKOUT_SESSION_ID}")
            .setCancelUrl(returnBase + "?payment=cancelled")
            .putMetadata("ticketId", String.valueOf(ticket.getId()))
            .addLineItem(
                SessionCreateParams.LineItem.builder()
                    .setQuantity(1L)
                    .setPriceData(
                        SessionCreateParams.LineItem.PriceData.builder()
                            .setCurrency(currency)
                            .setUnitAmount(unitAmount)
                            .setProductData(
                                SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                    .setName(code + " · " + ticket.getServiceType())
                                    .setDescription(truncate(ticket.getDescription(), 300))
                                    .build())
                            .build())
                    .build());

        if (ticket.getUser().getEmail() != null) {
            builder.setCustomerEmail(ticket.getUser().getEmail());
        }
        SessionCreateParams params = builder.build();

        try {
            Session session = Session.create(params);
            ticket.setStripeCheckoutSessionId(session.getId());
            ticketRepository.save(ticket);
            return session.getUrl();
        } catch (StripeException e) {
            throw new ApiException("Could not start payment: " + e.getMessage());
        }
    }

    /**
     * Confirms payment when the browser returns to the success URL. Retrieves the
     * ticket's Checkout session from Stripe and, if it has been paid, advances the
     * ticket. Safe to call repeatedly. Returns the (possibly updated) ticket.
     */
    @Transactional
    public TicketResponse confirmPayment(Long ticketId, UUID userId) {
        Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new TicketNotFoundException("Ticket not found: " + ticketId));
        if (ticket.getUser() == null || !ticket.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Only the ticket owner can confirm this payment.");
        }
        if (ticket.getStatus() == TicketStatus.COMPLETED) {
            return ticketService.getTicketDetails(ticketId);
        }
        String sessionId = ticket.getStripeCheckoutSessionId();
        if (!enabled || sessionId == null) {
            return ticketService.getTicketDetails(ticketId);
        }
        try {
            Session session = Session.retrieve(sessionId);
            if ("paid".equals(session.getPaymentStatus())) {
                return ticketService.markTicketPaid(ticketId, session.getPaymentIntent());
            }
        } catch (StripeException e) {
            System.err.println("[payment] confirm failed for ticket " + ticketId + ": " + e.getMessage());
        }
        return ticketService.getTicketDetails(ticketId);
    }

    /**
     * Verifies and processes a Stripe webhook. On {@code checkout.session.completed}
     * the corresponding ticket is marked paid. Throws on bad signatures so the
     * controller can return 400 and Stripe will retry.
     */
    public void handleWebhook(String payload, String signatureHeader) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            throw new ApiException("Webhook secret is not configured.");
        }
        Event event;
        try {
            event = Webhook.constructEvent(payload, signatureHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            throw new ApiException("Invalid webhook signature.");
        }

        if ("checkout.session.completed".equals(event.getType())
                || "checkout.session.async_payment_succeeded".equals(event.getType())) {
            Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
            if (session == null) return;
            if (session.getPaymentStatus() != null && !"paid".equals(session.getPaymentStatus())) {
                return; // unpaid (e.g. async pending) — wait for the *_succeeded event
            }
            Long ticketId = resolveTicketId(session);
            if (ticketId != null) {
                ticketService.markTicketPaid(ticketId, session.getPaymentIntent());
            }
        }
    }

    /** Clamps a string to {@code max} chars (Stripe rejects over-long product descriptions). */
    private static String truncate(String s, int max) {
        if (s == null) return null;
        String trimmed = s.strip();
        if (trimmed.isEmpty()) return null;
        return trimmed.length() <= max ? trimmed : trimmed.substring(0, max - 1) + "…";
    }

    /** Resolves the ticket id from the session metadata, falling back to the stored session id. */
    private Long resolveTicketId(Session session) {
        if (session.getMetadata() != null && session.getMetadata().get("ticketId") != null) {
            try {
                return Long.parseLong(session.getMetadata().get("ticketId"));
            } catch (NumberFormatException ignored) {
                // fall through to lookup by session id
            }
        }
        return ticketRepository.findByStripeCheckoutSessionId(session.getId())
            .map(Ticket::getId)
            .orElse(null);
    }
}
