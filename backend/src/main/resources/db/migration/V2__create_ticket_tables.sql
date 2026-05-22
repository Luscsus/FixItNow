CREATE TABLE IF NOT EXISTS locations (
    id BIGSERIAL PRIMARY KEY,
    address VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_locations_address UNIQUE (address, latitude, longitude)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS location_id BIGINT;
ALTER TABLE users
    ADD CONSTRAINT fk_users_location FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS tickets (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    location_id BIGINT,
    service_type VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    assigned_service_provider_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL',
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    estimated_cost NUMERIC(10, 2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tickets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_tickets_location FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
    CONSTRAINT fk_tickets_service_provider FOREIGN KEY (assigned_service_provider_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_locations_address ON locations (address);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets (status);
