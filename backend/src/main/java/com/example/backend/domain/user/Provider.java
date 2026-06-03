package com.example.backend.domain.user;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "providers")
@DiscriminatorValue("PROVIDER")
@PrimaryKeyJoinColumn(name = "id")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Provider extends User {

    @Column(name = "price_per_hour", precision = 10, scale = 2)
    private BigDecimal pricePerHour;

    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;

    @Column(name = "service_radius_km")
    private Integer serviceRadiusKm;

    @Column(length = 2000)
    private String bio;

    @Column(length = 50)
    private String phoneNumber;

    @ElementCollection(targetClass = ServiceCategory.class, fetch = FetchType.EAGER)
    @CollectionTable(
        name = "provider_categories",
        joinColumns = @JoinColumn(name = "provider_id")
    )
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    @Builder.Default
    private Set<ServiceCategory> categories = new HashSet<>();

    @Column(name = "approved_at")
    private java.time.LocalDateTime approvedAt;

    @Column(name = "approved_by")
    private java.util.UUID approvedBy;

    @Column(name = "rejection_reason", length = 1000)
    private String rejectionReason;

    // ─── Payout / invoice bank details ───────────────────────────────────────
    // Required before the provider can accept work. Stored on the Provider
    // entity (one bank account per provider). All nullable in the DB so we
    // can grandfather existing providers, but enforced at the service layer.

    /** Name on the bank account. Defaults to the provider's full name on first save. */
    @Column(name = "bank_account_holder", length = 200)
    private String bankAccountHolder;

    /** IBAN, stored without spaces (e.g. SI56123456789012345). Validated on write. */
    @Column(name = "bank_iban", length = 50)
    private String bankIban;

    /** BIC / SWIFT (8 or 11 chars). */
    @Column(name = "bank_bic", length = 20)
    private String bankBic;

    /** Free-text bank name for invoice display. */
    @Column(name = "bank_name", length = 200)
    private String bankName;

    // ─── Stripe Connect (Express) ─────────────────────────────────────────────
    // Connected-account id and capability flags, so customer payments can be
    // routed to this provider via destination charges. Flags mirror the Stripe
    // account state and are updated by the account.updated webhook.

    /** Connected Stripe account id (acct_…), null until onboarding starts. */
    @Column(name = "stripe_account_id", length = 255)
    private String stripeAccountId;

    /** Whether the connected account can accept charges (onboarding complete). */
    @Column(name = "stripe_charges_enabled", nullable = false)
    private boolean stripeChargesEnabled = false;

    /** Whether the connected account can receive payouts to its bank. */
    @Column(name = "stripe_payouts_enabled", nullable = false)
    private boolean stripePayoutsEnabled = false;
}
