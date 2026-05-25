-- Provider calendar: time blocks (AVAILABLE / BREAK / OFF / BOOKED) and ticket scheduling fields.

ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS scheduled_start_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS scheduled_end_at   TIMESTAMP;

CREATE TABLE IF NOT EXISTS provider_time_blocks (
    id          UUID PRIMARY KEY,
    provider_id UUID         NOT NULL,
    start_at    TIMESTAMP    NOT NULL,
    end_at      TIMESTAMP    NOT NULL,
    type        VARCHAR(16)  NOT NULL,
    title       VARCHAR(120),
    notes       VARCHAR(500),
    ticket_id   BIGINT,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_provider_time_blocks_provider
        FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    CONSTRAINT fk_provider_time_blocks_ticket
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL,
    CONSTRAINT ck_provider_time_blocks_range
        CHECK (end_at > start_at),
    CONSTRAINT ck_provider_time_blocks_type
        CHECK (type IN ('AVAILABLE', 'BREAK', 'OFF', 'BOOKED'))
);

CREATE INDEX IF NOT EXISTS idx_provider_time_blocks_provider_start
    ON provider_time_blocks (provider_id, start_at);

CREATE UNIQUE INDEX IF NOT EXISTS uq_provider_time_blocks_ticket
    ON provider_time_blocks (ticket_id)
    WHERE ticket_id IS NOT NULL;
