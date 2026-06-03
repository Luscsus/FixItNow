package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

/** Provider's Stripe Connect onboarding state, for the payouts UI. */
@Getter
@Setter
@AllArgsConstructor
public class ConnectStatusResponse {
    /** Whether a connected Stripe account exists for this provider. */
    private boolean connected;
    /** Whether the account can accept charges (onboarding complete). */
    private boolean chargesEnabled;
    /** Whether the account can receive payouts to its bank. */
    private boolean payoutsEnabled;
}
