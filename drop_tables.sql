-- ──────────────────────────────────────────────────────────────────────────────
-- Drop all application entity tables
-- Ordered children → parents so FK constraints are respected.
-- CASCADE is included as a safety net for any remaining references.
-- ──────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS notifications          CASCADE;  -- → users, tickets
DROP TABLE IF EXISTS reviews                CASCADE;  -- → users (provider + reviewer)
DROP TABLE IF EXISTS chat_message           CASCADE;  -- → chat_rooms, users
DROP TABLE IF EXISTS chat_rooms             CASCADE;  -- → users
DROP TABLE IF EXISTS ticket_status_history  CASCADE;  -- → tickets
DROP TABLE IF EXISTS saved_providers        CASCADE;  -- → users, providers
DROP TABLE IF EXISTS provider_time_blocks   CASCADE;  -- → providers
DROP TABLE IF EXISTS provider_categories    CASCADE;  -- → providers
DROP TABLE IF EXISTS tickets                CASCADE;  -- → users, locations, providers
DROP TABLE IF EXISTS refresh_tokens         CASCADE;  -- → users
DROP TABLE IF EXISTS verification_tokens    CASCADE;  -- → users
DROP TABLE IF EXISTS providers              CASCADE;  -- → users, locations
DROP TABLE IF EXISTS users                  CASCADE;  -- → locations
DROP TABLE IF EXISTS locations              CASCADE;  -- root

-- ──────────────────────────────────────────────────────────────────────────────
-- Optional: also wipe Flyway's migration history so the app can re-run all
-- migrations from scratch on next startup.
-- Uncomment the line below only if you want a full clean slate.
-- ──────────────────────────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS flyway_schema_history CASCADE;
