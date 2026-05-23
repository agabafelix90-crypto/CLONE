-- Add missing legacy employee password support
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS password TEXT;

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS login_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_login_code ON employees(login_code);
