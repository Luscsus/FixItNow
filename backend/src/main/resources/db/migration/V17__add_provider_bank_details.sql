ALTER TABLE providers
    ADD COLUMN bank_account_holder VARCHAR(200),
    ADD COLUMN bank_iban           VARCHAR(50),
    ADD COLUMN bank_bic            VARCHAR(20),
    ADD COLUMN bank_name           VARCHAR(200);
