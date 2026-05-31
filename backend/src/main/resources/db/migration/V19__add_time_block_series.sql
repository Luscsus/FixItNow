-- Repeating availability: group the materialized occurrences of a recurring block under a shared series id.

ALTER TABLE provider_time_blocks
    ADD COLUMN IF NOT EXISTS series_id UUID;

CREATE INDEX IF NOT EXISTS idx_provider_time_blocks_series
    ON provider_time_blocks (series_id)
    WHERE series_id IS NOT NULL;
