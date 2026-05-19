
-- Pharmacy Inventory table
CREATE TABLE public.pharmacy_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_name text NOT NULL,
  generic_name text,
  category text DEFAULT 'General',
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  cost_price numeric(10,2) DEFAULT 0,
  quantity_in_stock integer NOT NULL DEFAULT 0,
  reorder_level integer DEFAULT 10,
  unit text DEFAULT 'Tablets',
  batch_number text,
  expiry_date date,
  supplier text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Pharmacy Sales (receipts)
CREATE TABLE public.pharmacy_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number text NOT NULL UNIQUE,
  patient_id uuid REFERENCES public.patients(id),
  patient_name text,
  sale_type text NOT NULL DEFAULT 'over_the_counter' CHECK (sale_type IN ('over_the_counter', 'prescription')),
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'Cash',
  sold_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Pharmacy Sale Items
CREATE TABLE public.pharmacy_sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.pharmacy_sales(id) ON DELETE CASCADE NOT NULL,
  inventory_id uuid REFERENCES public.pharmacy_inventory(id) NOT NULL,
  drug_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Prescriptions queue
CREATE TABLE public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) NOT NULL,
  prescribed_by uuid,
  drug_name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dispensed', 'cancelled')),
  dispensed_by uuid,
  dispensed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pharmacy_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies - authenticated users
CREATE POLICY "Authenticated users can view inventory" ON public.pharmacy_inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert inventory" ON public.pharmacy_inventory FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update inventory" ON public.pharmacy_inventory FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view sales" ON public.pharmacy_sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert sales" ON public.pharmacy_sales FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can view sale items" ON public.pharmacy_sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert sale items" ON public.pharmacy_sale_items FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can view prescriptions" ON public.prescriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert prescriptions" ON public.prescriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update prescriptions" ON public.prescriptions FOR UPDATE TO authenticated USING (true);
