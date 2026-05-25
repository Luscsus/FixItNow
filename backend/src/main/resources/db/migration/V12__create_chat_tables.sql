-- Chat tables

CREATE TABLE IF NOT EXISTS chat_message (
    id BIGSERIAL PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chat_room_id UUID NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(10) NOT NULL DEFAULT 'TEXT',
    message_status VARCHAR(10) NOT NULL DEFAULT 'SENT',
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    timestamp TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_room_timestamp
    ON chat_message (chat_room_id, timestamp);

-- Chat rooms and ticket link

CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_chat_rooms_ticket UNIQUE (ticket_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_customer ON chat_rooms (customer_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_provider ON chat_rooms (provider_id);

ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS chat_room_id UUID;

ALTER TABLE chat_message
    ADD CONSTRAINT fk_chat_message_room
    FOREIGN KEY (chat_room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE;
