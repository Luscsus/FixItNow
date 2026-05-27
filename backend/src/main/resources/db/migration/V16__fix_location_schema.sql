-- V6 (provider_use_location_entity) and V7 (location_structured_address) were
-- never applied because migration files were renumbered after those versions
-- had already been recorded in flyway_schema_history with different content.
-- This migration applies their intended changes.

-- From V6: remove legacy coordinate columns from providers
ALTER TABLE providers DROP COLUMN IF EXISTS location_lat;
ALTER TABLE providers DROP COLUMN IF EXISTS location_lon;
DROP INDEX IF EXISTS idx_providers_location;

-- From V7: drop the old monolithic address column (structured fields already exist)
ALTER TABLE locations DROP COLUMN IF EXISTS address;
