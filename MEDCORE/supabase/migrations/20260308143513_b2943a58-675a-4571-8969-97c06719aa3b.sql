
-- Store invoices (when stock is received from suppliers)
CREATE TABLE public.store_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL,
  supplier text NOT NULL DEFAULT '',
  total_amount numeric NOT NULL DEFAULT 0,
  notes text,
  received_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view invoices" ON public.store_invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert invoices" ON public.store_invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update invoices" ON public.store_invoices FOR UPDATE TO authenticated USING (true);

-- Store invoice items
CREATE TABLE public.store_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.store_invoices(id) ON DELETE CASCADE NOT NULL,
  inventory_id uuid REFERENCES public.pharmacy_inventory(id) NOT NULL,
  drug_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  cost_price numeric NOT NULL DEFAULT 0,
  total_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view invoice items" ON public.store_invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert invoice items" ON public.store_invoice_items FOR INSERT TO authenticated WITH CHECK (true);

-- Shelf transfers (store → pharmacy shelves)
CREATE TABLE public.store_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid REFERENCES public.pharmacy_inventory(id) NOT NULL,
  drug_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  transferred_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view transfers" ON public.store_transfers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert transfers" ON public.store_transfers FOR INSERT TO authenticated WITH CHECK (true);
