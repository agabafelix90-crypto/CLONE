-- 1. Ensure pgcrypto is available for secure password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Employees table for clinic staff
CREATE TABLE IF NOT EXISTS public.clinic_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE,
  role app_role NOT NULL DEFAULT 'receptionist',
  permissions jsonb NOT NULL DEFAULT '{}' :: jsonb,
  password_hash text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clinic_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their employees" ON public.clinic_employees
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can insert employee records" ON public.clinic_employees
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can update their employees" ON public.clinic_employees
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can delete their employees" ON public.clinic_employees
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 3. Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_clinic_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clinic_employees_updated_at
BEFORE UPDATE ON public.clinic_employees
FOR EACH ROW EXECUTE FUNCTION public.update_clinic_employees_updated_at();

-- 4. RPC function to verify employee credentials
CREATE OR REPLACE FUNCTION public.verify_employee_credentials(
  owner_id uuid,
  employee_id uuid,
  password text
)
RETURNS TABLE (id uuid, full_name text, role app_role, email text, permissions jsonb) AS $$
  SELECT id, full_name, role, email, permissions
  FROM public.clinic_employees
  WHERE owner_id = owner_id
    AND id = employee_id
    AND active = true
    AND password_hash = crypt(password, password_hash)
$$ LANGUAGE sql STABLE;

-- 5. RPC function to create clinic employee with a secure password hash.
CREATE OR REPLACE FUNCTION public.create_clinic_employee(
  owner_id uuid,
  full_name text,
  role app_role,
  email text,
  password text
)
RETURNS public.clinic_employees AS $$
DECLARE
  default_permissions jsonb;
BEGIN
  -- Set default permissions based on role
  CASE role
    WHEN 'admin' THEN
      default_permissions := '{"editBills": true, "cashier": true, "dispensary": true, "radiology": true, "store": true, "doctor": true, "laboratory": true, "nurse": true, "triage": true, "manageServices": true, "sendSMS": true, "manageDrugs": true, "clinicStats": true, "salesHistory": true}'::jsonb;
    WHEN 'doctor' THEN
      default_permissions := '{"doctor": true, "laboratory": true, "radiology": true, "manageServices": true}'::jsonb;
    WHEN 'nurse' THEN
      default_permissions := '{"nurse": true, "triage": true, "manageServices": true}'::jsonb;
    WHEN 'cashier' THEN
      default_permissions := '{"cashier": true, "editBills": true}'::jsonb;
    WHEN 'pharmacist' THEN
      default_permissions := '{"dispensary": true, "manageDrugs": true}'::jsonb;
    WHEN 'receptionist' THEN
      default_permissions := '{"manageServices": true, "sendSMS": true}'::jsonb;
    ELSE
      default_permissions := '{}'::jsonb;
  END CASE;

  INSERT INTO public.clinic_employees (owner_id, full_name, role, email, password_hash, permissions)
  VALUES (owner_id, full_name, role, email, crypt(password, gen_salt('bf')), default_permissions)
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC function to update clinic employee permissions and optional password
CREATE OR REPLACE FUNCTION public.update_clinic_employee_permissions(
  owner_id uuid,
  employee_id uuid,
  permissions jsonb,
  password text DEFAULT NULL
)
RETURNS public.clinic_employees AS $$
  UPDATE public.clinic_employees
  SET
    permissions = permissions,
    password_hash = CASE
      WHEN password IS NOT NULL AND length(password) > 0 THEN crypt(password, gen_salt('bf'))
      ELSE password_hash
    END,
    updated_at = now()
  WHERE owner_id = owner_id
    AND id = employee_id
    AND active = true
  RETURNING *;
$$ LANGUAGE sql SECURITY DEFINER;
