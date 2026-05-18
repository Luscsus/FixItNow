-- Adds provider subtype tables and supporting structures for the
-- PROVIDER / CUSTOMER / ADMIN user-type split and the provider-approval workflow.
--
-- The `users` table already exists (created by Hibernate ddl-auto). This migration
-- only adds the new joined-table for Provider plus its categories collection table.
-- The `user_type` discriminator column is also added in case existing schemas
-- predate the @DiscriminatorColumn change.

-- Discriminator column (idempotent — Hibernate may have already created it)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS user_type VARCHAR(31) NOT NULL DEFAULT 'USER';

-- Provider joined table: one-to-one with users.id
CREATE TABLE IF NOT EXISTS providers (
    id                  UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    location_lat        NUMERIC(10, 7),
    location_lon        NUMERIC(10, 7),
    price_per_hour      NUMERIC(10, 2),
    years_of_experience INTEGER,
    service_radius_km   INTEGER,
    bio                 VARCHAR(2000),
    phone_number        VARCHAR(50),
    approved_at         TIMESTAMP,
    approved_by         UUID,
    rejection_reason    VARCHAR(1000)
);

CREATE INDEX IF NOT EXISTS idx_providers_location ON providers (location_lat, location_lon);

-- Categories: a provider can offer multiple service categories
CREATE TABLE IF NOT EXISTS provider_categories (
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    category    VARCHAR(50) NOT NULL,
    PRIMARY KEY (provider_id, category)
);

CREATE INDEX IF NOT EXISTS idx_provider_categories_category ON provider_categories (category);

-- Indexes that help the most common admin queries
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users (role);
