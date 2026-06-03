package com.example.backend.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Wires the Stripe SDK with the secret API key on startup. The key is read from
 * the {@code stripe.secret-key} property (env var {@code STRIPE_SECRET_KEY}). If
 * it's blank, the SDK is left unconfigured — payment endpoints will then fail
 * with a clear error rather than silently using a wrong key.
 */
@Configuration
public class StripeConfig {

    @Value("${stripe.secret-key:}")
    private String secretKey;

    @PostConstruct
    public void init() {
        if (secretKey != null && !secretKey.isBlank()) {
            Stripe.apiKey = secretKey;
        } else {
            System.err.println("[stripe] STRIPE_SECRET_KEY is not set — payments are disabled.");
        }
    }
}
