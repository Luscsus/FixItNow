CREATE TABLE ticket_status_history (
    id         BIGSERIAL PRIMARY KEY,
    ticket_id  BIGINT       NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    status     VARCHAR(50)  NOT NULL,
    changed_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_status_history_ticket_id ON ticket_status_history(ticket_id);

-- Seed initial PENDING_APPROVAL event from creation time for all existing tickets
INSERT INTO ticket_status_history (ticket_id, status, changed_at)
SELECT id, 'PENDING_APPROVAL', created_at FROM tickets;

-- Seed current status for tickets that have moved past PENDING_APPROVAL
INSERT INTO ticket_status_history (ticket_id, status, changed_at)
SELECT id, status, updated_at FROM tickets WHERE status <> 'PENDING_APPROVAL';
