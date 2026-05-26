CREATE TABLE reviews (
    id           UUID         NOT NULL PRIMARY KEY,
    reviewer_id  UUID         NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
    provider_id  UUID         NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    rating       INTEGER      NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment      VARCHAR(2000),
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_review_reviewer_provider UNIQUE (reviewer_id, provider_id)
);

CREATE INDEX ix_review_provider ON reviews (provider_id);
CREATE INDEX ix_review_reviewer ON reviews (reviewer_id);
