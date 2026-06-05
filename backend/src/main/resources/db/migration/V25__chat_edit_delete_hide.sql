-- Message edit/delete (soft) + per-user conversation hide.
ALTER TABLE chat_message
    ADD COLUMN edited_at TIMESTAMP NULL,
    ADD COLUMN deleted   BOOLEAN   NOT NULL DEFAULT FALSE;

-- A conversation can be removed from one participant's inbox without affecting
-- the other party or the underlying message history (re-appears on a new message).
ALTER TABLE chat_rooms
    ADD COLUMN hidden_for_customer BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN hidden_for_provider BOOLEAN NOT NULL DEFAULT FALSE;
