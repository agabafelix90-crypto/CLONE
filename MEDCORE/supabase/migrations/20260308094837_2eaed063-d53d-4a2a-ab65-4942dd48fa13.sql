
-- 1. ENUM TYPES
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'nurse', 'pharmacist', 'cashier', 'receptionist');
CREATE TYPE public.patient_status AS ENUM ('Just Come', 'On Antenatal', 'Post Natal', 'In Labour', 'Discharged', 'Admitted', 'Outpatient');
CREATE TYPE public.med_status AS ENUM ('Pending', 'Given', 'Missed', 'Held');
CREATE TYPE public.bed_status AS ENUM ('Available', 'Occupied', 'Maintenance');

-- 2. UTILITY FUNCTION
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 3. PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  department TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. USER ROLES TABLE
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. PATIENTS TABLE
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  phone TEXT,
  address TEXT,
  religion TEXT,
  status patient_status NOT NULL DEFAULT 'Just Come',
  edd TEXT,
  gravida TEXT,
  para TEXT,
  abortions TEXT,
  blood_group TEXT,
  rhesus TEXT,
  lnmp TEXT,
  ward TEXT,
  bed_number TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view patients" ON public.patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update patients" ON public.patients FOR UPDATE TO authenticated USING (true);
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. VITALS TABLE
CREATE TABLE public.vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  temperature NUMERIC,
  systolic INTEGER,
  diastolic INTEGER,
  pulse INTEGER,
  respiratory_rate INTEGER,
  oxygen_sat INTEGER,
  recorded_by UUID REFERENCES auth.users(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view vitals" ON public.vitals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert vitals" ON public.vitals FOR INSERT TO authenticated WITH CHECK (true);

-- 7. MEDICATIONS TABLE
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  drug_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  route TEXT NOT NULL DEFAULT 'Oral',
  frequency TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  status med_status NOT NULL DEFAULT 'Pending',
  administered_by UUID REFERENCES auth.users(id),
  administered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view medications" ON public.medications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert medications" ON public.medications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update medications" ON public.medications FOR UPDATE TO authenticated USING (true);

-- 8. WARDS TABLE
CREATE TABLE public.wards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  total_beds INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view wards" ON public.wards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage wards" ON public.wards FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 9. BEDS TABLE
CREATE TABLE public.beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id UUID NOT NULL REFERENCES public.wards(id) ON DELETE CASCADE,
  bed_number TEXT NOT NULL,
  status bed_status NOT NULL DEFAULT 'Available',
  patient_id UUID REFERENCES public.patients(id),
  UNIQUE (ward_id, bed_number)
);
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view beds" ON public.beds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update beds" ON public.beds FOR UPDATE TO authenticated USING (true);

-- 10. AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. SEED DEFAULT WARDS
INSERT INTO public.wards (name, total_beds) VALUES
  ('General Ward', 12),
  ('Maternity Ward', 8),
  ('Paediatric Ward', 6),
  ('Private Ward', 4);
