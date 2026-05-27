-- ──────────────────────────────────────────────────────────────────────────────
-- Drop all application entity tables
-- Ordered children → parents so FK constraints are respected.
-- CASCADE is included as a safety net for any remaining references.
-- ──────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS reviews                CASCADE;
DROP TABLE IF EXISTS chat_message           CASCADE;
DROP TABLE IF EXISTS chat_rooms             CASCADE;
DROP TABLE IF EXISTS ticket_status_history  CASCADE;
DROP TABLE IF EXISTS saved_providers        CASCADE;
DROP TABLE IF EXISTS provider_time_blocks   CASCADE;
DROP TABLE IF EXISTS provider_categories    CASCADE;
DROP TABLE IF EXISTS tickets                CASCADE;
DROP TABLE IF EXISTS refresh_tokens         CASCADE;
DROP TABLE IF EXISTS verification_tokens    CASCADE;
DROP TABLE IF EXISTS providers              CASCADE;
DROP TABLE IF EXISTS users                  CASCADE;
DROP TABLE IF EXISTS locations              CASCADE;

-- ──────────────────────────────────────────────────────────────────────────────
-- Optional: also wipe Flyway's migration history so the app can re-run all
-- migrations from scratch on next startup.
-- Uncomment the line below only if you want a full clean slate.
-- ──────────────────────────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS flyway_schema_history CASCADE;
