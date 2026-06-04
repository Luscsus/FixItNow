-- Soft-delete support for user accounts. We never hard-delete users so that
-- tickets, messages, invoices, payouts, reviews, and audit history remain intact.
ALTER TABLE users
    ADD COLUMN deleted         BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN deleted_at      TIMESTAMP   NULL,
    ADD COLUMN deleted_by      UUID        NULL,
    ADD COLUMN deletion_reason VARCHAR(500) NULL;

-- Fast lookups for "active (non-deleted) users" used by search / listings.
CREATE INDEX ix_users_deleted ON users (deleted);
