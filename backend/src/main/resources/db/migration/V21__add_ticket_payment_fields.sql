-- Stripe payment tracking for ticket invoices. When the customer pays the
-- invoice via Stripe Checkout, we record the session / payment-intent ids
-- (for idempotency and reconciliation) and the moment the payment cleared.
-- One row per ticket; populated only once the customer initiates payment.

ALTER TABLE tickets
    ADD COLUMN stripe_checkout_session_id VARCHAR(255),
    ADD COLUMN stripe_payment_intent_id   VARCHAR(255),
    ADD COLUMN paid_at                     TIMESTAMP;
