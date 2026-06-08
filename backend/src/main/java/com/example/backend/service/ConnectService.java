package com.example.backend.service;

import com.example.backend.common.exception.ApiException;
import com.example.backend.domain.user.Provider;
import com.example.backend.dto.ConnectStatusResponse;
import com.example.backend.exception.UserNotFoundException;
import com.example.backend.repository.ProviderRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.Account;
import com.stripe.param.AccountCreateParams;
import com.stripe.param.AccountLinkCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Stripe Connect (Express) onboarding for providers. Each provider gets a
 * connected Stripe account; customer payments are then routed to it via
 * destination charges (see {@link PaymentService}). Providers onboard through a
 * Stripe-hosted flow reached via {@link #createOnboardingLink}.
 */
@Service
public class ConnectService {

    private final ProviderRepository providerRepository;
    private final String frontendUrl;
    private final boolean enabled;

    public ConnectService(ProviderRepository providerRepository,
                          @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl,
                          @Value("${stripe.secret-key:}") String secretKey) {
        this.providerRepository = providerRepository;
        this.frontendUrl = frontendUrl;
        this.enabled = secretKey != null && !secretKey.isBlank();
    }

    /**
     * Returns a Stripe-hosted onboarding URL for the provider, creating the
     * connected Express account first if they don't have one yet.
     */
    @Transactional
    public String createOnboardingLink(UUID providerId) {
        if (!enabled) {
            throw new ApiException("Payments are not configured. Set STRIPE_SECRET_KEY to enable Stripe Connect.");
        }
        Provider provider = providerRepository.findById(providerId)
            .orElseThrow(() -> new UserNotFoundException("Provider not found: " + providerId));

        try {
            String accountId = provider.getStripeAccountId();
            if (accountId == null || accountId.isBlank()) {
                AccountCreateParams.Builder params = AccountCreateParams.builder()
                    .setType(AccountCreateParams.Type.EXPRESS)
                    .setCapabilities(
                        AccountCreateParams.Capabilities.builder()
                            .setCardPayments(
                                AccountCreateParams.Capabilities.CardPayments.builder()
                                    .setRequested(true)
                                    .build())
                            .setTransfers(
                                AccountCreateParams.Capabilities.Transfers.builder()
                                    .setRequested(true)
                                    .build())
                            .build());
                if (provider.getEmail() != null) {
                    params.setEmail(provider.getEmail());
                }
                Account account = Account.create(params.build());
                accountId = account.getId();
                provider.setStripeAccountId(accountId);
                providerRepository.save(provider);
            }

            String base = frontendUrl + "/profile/edit";
            AccountLinkCreateParams linkParams = AccountLinkCreateParams.builder()
                .setAccount(accountId)
                // refresh_url is hit if the link expires before completion → restart.
                .setRefreshUrl(base + "?connect=refresh")
                .setReturnUrl(base + "?connect=done")
                .setType(AccountLinkCreateParams.Type.ACCOUNT_ONBOARDING)
                .build();
            return com.stripe.model.AccountLink.create(linkParams).getUrl();
        } catch (StripeException e) {
            throw new ApiException("Could not start Stripe onboarding: " + e.getMessage());
        }
    }

    /** Re-fetches the connected account from Stripe and syncs the capability flags. */
    @Transactional
    public ConnectStatusResponse refreshStatus(UUID providerId) {
        Provider provider = providerRepository.findById(providerId)
            .orElseThrow(() -> new UserNotFoundException("Provider not found: " + providerId));
        if (enabled && provider.getStripeAccountId() != null) {
            try {
                Account account = Account.retrieve(provider.getStripeAccountId());
                applyAccountState(provider, account);
                providerRepository.save(provider);
            } catch (StripeException e) {
                System.err.println("[connect] status refresh failed for provider " + providerId + ": " + e.getMessage());
            }
        }
        return toStatus(provider);
    }

    @Transactional(readOnly = true)
    public ConnectStatusResponse getStatus(UUID providerId) {
        Provider provider = providerRepository.findById(providerId)
            .orElseThrow(() -> new UserNotFoundException("Provider not found: " + providerId));
        return toStatus(provider);
    }

    /** Copies the connected account's capability flags onto the provider entity. */
    public void applyAccountState(Provider provider, Account account) {
        provider.setStripeChargesEnabled(Boolean.TRUE.equals(account.getChargesEnabled()));
        provider.setStripePayoutsEnabled(Boolean.TRUE.equals(account.getPayoutsEnabled()));
    }

    private ConnectStatusResponse toStatus(Provider provider) {
        boolean connected = provider.getStripeAccountId() != null && !provider.getStripeAccountId().isBlank();
        return new ConnectStatusResponse(
            connected,
            provider.isStripeChargesEnabled(),
            provider.isStripePayoutsEnabled());
    }
}
