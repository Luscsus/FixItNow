-- Internationalize notifications: store i18n message keys + interpolation params
-- alongside the existing title/body. The title/body columns are kept as a
-- plain-English fallback (for old rows and any non-keyed path); the frontend
-- prefers the keys when present and renders them through i18next.

ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS title_key VARCHAR(255),
    ADD COLUMN IF NOT EXISTS body_key VARCHAR(255),
    ADD COLUMN IF NOT EXISTS params_json TEXT;
