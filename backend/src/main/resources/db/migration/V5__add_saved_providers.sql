CREATE TABLE saved_providers (
    user_id     UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID      NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, provider_id)
);

CREATE INDEX idx_saved_providers_user ON saved_providers (user_id);
