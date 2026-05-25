-- User-requested schedule times on a ticket (set at creation when user picks from provider availability).
-- These are copied to scheduled_start_at / scheduled_end_at when the provider confirms.

ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS requested_start_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS requested_end_at   TIMESTAMP;
