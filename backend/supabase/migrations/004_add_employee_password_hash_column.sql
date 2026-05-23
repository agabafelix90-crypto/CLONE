-- Migration: Add employee password_hash column for compatibility with owners_info.auth.password_hash
-- Created: 2026-05-23

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Backfill existing password values into password_hash where available
UPDATE employees
SET password_hash = password
WHERE password_hash IS NULL AND password IS NOT NULL;
