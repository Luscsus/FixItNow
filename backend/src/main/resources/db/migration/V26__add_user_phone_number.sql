-- Move the phone number up from `providers` onto the base `users` table so
-- both customers and providers can have one. Existing provider phone numbers
-- are migrated, then the old column is dropped.

ALTER TABLE users ADD COLUMN phone_number VARCHAR(50);

-- Preserve existing provider phone numbers.
UPDATE users u
   SET phone_number = p.phone_number
  FROM providers p
 WHERE p.id = u.id
   AND p.phone_number IS NOT NULL;

ALTER TABLE providers DROP COLUMN phone_number;
