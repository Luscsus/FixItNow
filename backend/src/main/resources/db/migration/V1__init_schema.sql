-- Initial schema. Uses IF NOT EXISTS so the migration can be applied
-- on an existing database (paired with spring.flyway.baseline-on-migrate=true)
-- without disturbing tables that were previously created by Hibernate's
-- ddl-auto=update.

CREATE TABLE IF NOT EXISTS users (
    id                  uuid            PRIMARY KEY,
    email               varchar(255)    NOT NULL UNIQUE,
    password            varchar(255)    NOT NULL,
    first_name          varchar(100)    NOT NULL,
    last_name           varchar(100)    NOT NULL,
    role                varchar(50)     NOT NULL,
    status              varchar(50)     NOT NULL,
    email_verified      boolean         NOT NULL,
    two_factor_enabled  boolean         NOT NULL,
    two_factor_secret   varchar(100),
    user_type           varchar(31)     NOT NULL,
    created_at          timestamp(6)    NOT NULL,
    updated_at          timestamp(6)    NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
    id           uuid           PRIMARY KEY,
    token        varchar(255)   NOT NULL UNIQUE,
    token_type   varchar(255)   NOT NULL,
    user_id      uuid           NOT NULL REFERENCES users (id),
    expires_at   timestamp(6)   NOT NULL,
    used         boolean        NOT NULL,
    created_at   timestamp(6)   NOT NULL
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id           uuid           PRIMARY KEY,
    token        varchar(255)   NOT NULL UNIQUE,
    user_id      uuid           NOT NULL REFERENCES users (id),
    expires_at   timestamp(6)   NOT NULL,
    revoked      boolean        NOT NULL,
    created_at   timestamp(6)   NOT NULL
);
