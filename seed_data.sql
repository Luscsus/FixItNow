-- =============================================================================
-- Minimal seed: admin user only
-- Credentials: luka1.grobelnik@gmail.com / Geslo123!
-- =============================================================================

INSERT INTO users (
    id, user_type, email, password,
    first_name, last_name, role, status,
    email_verified, two_factor_enabled,
    location_id, created_at, updated_at
) VALUES (
    gen_random_uuid(), 'USER',
    'luka1.grobelnik@gmail.com',
    '$2b$10$W.gv9evUSVrmxRUx4KPhYudP9oPNofv5iOygZcTQprH92PTvWHHmK',
    'Luka', 'Grobelnik',
    'ADMIN', 'ACTIVE',
    TRUE, FALSE,
    NULL, NOW(), NOW()
) ON CONFLICT (email) DO NOTHING;
