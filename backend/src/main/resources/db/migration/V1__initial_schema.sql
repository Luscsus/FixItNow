-- Initial schema

CREATE TABLE users (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_type           VARCHAR(31) NOT NULL DEFAULT 'USER',
    email               VARCHAR(255) NOT NULL UNIQUE,
    password            VARCHAR(255) NOT NULL,
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    role                VARCHAR(50)  NOT NULL DEFAULT 'CUSTOMER',
    status              VARCHAR(50)  NOT NULL DEFAULT 'PENDING_VERIFICATION',
    email_verified      BOOLEAN      NOT NULL DEFAULT FALSE,
    two_factor_enabled  BOOLEAN      NOT NULL DEFAULT FALSE,
    two_factor_secret   VARCHAR(100),
    created_at          TIMESTAMP    NOT NULL,
    updated_at          TIMESTAMP    NOT NULL,

    CONSTRAINT users_role_check   CHECK (role   IN ('CUSTOMER', 'PROVIDER', 'ADMIN')),
    CONSTRAINT users_status_check CHECK (status IN ('PENDING_VERIFICATION', 'PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'REJECTED', 'DELETED'))
);

CREATE TABLE providers (
    id                  UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
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

CREATE TABLE provider_categories (
    provider_id UUID        NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    category    VARCHAR(50) NOT NULL,
    PRIMARY KEY (provider_id, category),
    CONSTRAINT provider_categories_category_check CHECK (category IN (
        'PLUMBING', 'ELECTRICAL', 'CARPENTRY', 'PAINTING', 'CLEANING',
        'GARDENING', 'MOVING', 'APPLIANCE_REPAIR', 'HVAC', 'ROOFING',
        'LOCKSMITH', 'PEST_CONTROL', 'TUTORING', 'IT_SUPPORT', 'OTHER'
    ))
);

CREATE TABLE verification_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    token       VARCHAR(255) NOT NULL UNIQUE,
    token_type  VARCHAR(50)  NOT NULL,
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMP    NOT NULL,
    used        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL,

    CONSTRAINT verification_tokens_type_check CHECK (token_type IN ('EMAIL_CONFIRMATION', 'PASSWORD_RESET'))
);

CREATE TABLE refresh_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    token       VARCHAR(255) NOT NULL UNIQUE,
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMP    NOT NULL,
    revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL
);

CREATE INDEX idx_users_email          ON users (email);
CREATE INDEX idx_users_role           ON users (role);
CREATE INDEX idx_users_status         ON users (status);
CREATE INDEX idx_providers_location   ON providers (location_lat, location_lon);
CREATE INDEX idx_provider_categories  ON provider_categories (category);
CREATE INDEX idx_verification_tokens  ON verification_tokens (token);
CREATE INDEX idx_refresh_tokens       ON refresh_tokens (token);
