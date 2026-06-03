package com.example.backend.service;

import com.example.backend.common.exception.ApiException;
import com.example.backend.domain.ticket.Ticket;
import com.example.backend.domain.ticket.TicketStatus;
import com.example.backend.domain.user.Provider;
import com.example.backend.dto.TicketResponse;
import com.example.backend.exception.TicketNotFoundException;
import com.example.backend.repository.ProviderRepository;
import com.example.backend.repository.TicketRepository;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Account;
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
    private final ProviderRepository providerRepository;
    private final TicketService ticketService;
    private final ConnectService connectService;
    private final String frontendUrl;
    private final String currency;
    private final String webhookSecret;
    private final BigDecimal applicationFeePercent;
    private final boolean enabled;

    public PaymentService(TicketRepository ticketRepository,
                          ProviderRepository providerRepository,
                          TicketService ticketService,
                          ConnectService connectService,
                          @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl,
                          @Value("${stripe.currency:eur}") String currency,
                          @Value("${stripe.secret-key:}") String secretKey,
                          @Value("${stripe.webhook-secret:}") String webhookSecret,
                          @Value("${stripe.application-fee-percent:10}") BigDecimal applicationFeePercent) {
        this.ticketRepository = ticketRepository;
        this.providerRepository = providerRepository;
        this.ticketService = ticketService;
        this.connectService = connectService;
        this.frontendUrl = frontendUrl;
        this.currency = currency;
        this.webhookSecret = webhookSecret;
        this.applicationFeePercent = applicationFeePercent;
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
        if (amount.compareTo(BigDecimal.ONE) < 0) {
            throw new ApiException("The minimum payment amount is €1.00.");
        }

        // The invoice owner (provider) must have completed Stripe Connect onboarding,
        // otherwise the funds would land in the platform account instead of theirs.
        Provider provider = ticket.getAssignedServiceProvider() == null ? null
            : providerRepository.findById(ticket.getAssignedServiceProvider().getId()).orElse(null);
        if (provider == null || provider.getStripeAccountId() == null || !provider.isStripeChargesEnabled()) {
            throw new ApiException(
                "This provider hasn't finished setting up payouts yet, so payment can't be collected. "
                + "Please try again once they've completed their Stripe onboarding.");
        }

        String code = String.format("FIX-%04d", ticket.getId());
        long unitAmount = amount.setScale(2, RoundingMode.HALF_UP).movePointRight(2).longValueExact();
        long feeAmount = computeApplicationFee(unitAmount);
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

        // Destination charge: route the funds to the provider's connected account,
        // keeping the platform's application fee. Without transfer_data the money
        // would stay in the platform account (the bug this fixes).
        SessionCreateParams.PaymentIntentData.Builder piData =
            SessionCreateParams.PaymentIntentData.builder()
                .setTransferData(
                    SessionCreateParams.PaymentIntentData.TransferData.builder()
                        .setDestination(provider.getStripeAccountId())
                        .build());
        if (feeAmount > 0) {
            piData.setApplicationFeeAmount(feeAmount);
        }
        builder.setPaymentIntentData(piData.build());

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
        } else if ("account.updated".equals(event.getType())) {
            // A connected provider account changed (e.g. finished onboarding) —
            // sync the cached charges/payouts flags.
            Account account = (Account) event.getDataObjectDeserializer().getObject().orElse(null);
            if (account == null) return;
            providerRepository.findByStripeAccountId(account.getId()).ifPresent(provider -> {
                connectService.applyAccountState(provider, account);
                providerRepository.save(provider);
            });
        }
    }

    /** Platform commission in cents, rounded half-up; clamped below the total. */
    private long computeApplicationFee(long unitAmountCents) {
        if (applicationFeePercent == null || applicationFeePercent.signum() <= 0) {
            return 0L;
        }
        long fee = BigDecimal.valueOf(unitAmountCents)
            .multiply(applicationFeePercent)
            .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
            .longValueExact();
        // Never charge a fee equal to or above the whole amount.
        return Math.max(0, Math.min(fee, unitAmountCents - 1));
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
