-- Stripe Connect (Express) onboarding for providers. Each provider gets a
-- connected Stripe account so customer payments can be routed to them via
-- destination charges (the platform keeps a configurable application fee).
-- charges_enabled / payouts_enabled mirror the connected account's state and
-- are kept in sync via the account.updated webhook.

ALTER TABLE providers
    ADD COLUMN stripe_account_id      VARCHAR(255),
    ADD COLUMN stripe_charges_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN stripe_payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE;
