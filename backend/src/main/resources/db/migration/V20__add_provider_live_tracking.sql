-- Live GPS tracking: the provider's most-recent position while en route to a
-- ticket, plus a one-shot flag so the "provider is nearby" notification fires
-- only once per trip. One row per ticket, overwritten on each location update.

ALTER TABLE tickets
    ADD COLUMN provider_lat                DOUBLE PRECISION,
    ADD COLUMN provider_lng                DOUBLE PRECISION,
    ADD COLUMN provider_location_updated_at TIMESTAMP,
    ADD COLUMN provider_nearby_notified    BOOLEAN NOT NULL DEFAULT FALSE;
