-- Second-pass tenant isolation hardening

-- Ownership columns/defaults
ALTER TABLE public.patients ALTER COLUMN created_by SET DEFAULT auth.uid();
ALTER TABLE public.vitals ALTER COLUMN recorded_by SET DEFAULT auth.uid();
ALTER TABLE public.pharmacy_inventory ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();
ALTER TABLE public.pharmacy_sales ALTER COLUMN sold_by SET DEFAULT auth.uid();
ALTER TABLE public.prescriptions ALTER COLUMN prescribed_by SET DEFAULT auth.uid();
ALTER TABLE public.lab_tests ALTER COLUMN ordered_by SET DEFAULT auth.uid();
ALTER TABLE public.store_invoices ALTER COLUMN received_by SET DEFAULT auth.uid();
ALTER TABLE public.store_transfers ALTER COLUMN transferred_by SET DEFAULT auth.uid();
ALTER TABLE public.wards ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();
ALTER TABLE public.lab_test_templates ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();

-- Patients
DROP POLICY IF EXISTS "Authenticated users can view patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can update patients" ON public.patients;

CREATE POLICY "Users can view own patients" ON public.patients
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own patients" ON public.patients
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own patients" ON public.patients
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Vitals
DROP POLICY IF EXISTS "Authenticated users can view vitals" ON public.vitals;
DROP POLICY IF EXISTS "Authenticated users can insert vitals" ON public.vitals;

CREATE POLICY "Users can view own vitals" ON public.vitals
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    recorded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = vitals.patient_id
        AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert own vitals" ON public.vitals
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    recorded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = vitals.patient_id
        AND p.created_by = auth.uid()
    )
  );

-- Medications
DROP POLICY IF EXISTS "Authenticated users can view medications" ON public.medications;
DROP POLICY IF EXISTS "Authenticated users can insert medications" ON public.medications;
DROP POLICY IF EXISTS "Authenticated users can update medications" ON public.medications;

CREATE POLICY "Users can view own medications" ON public.medications
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = medications.patient_id
        AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert own medications" ON public.medications
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = medications.patient_id
        AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update own medications" ON public.medications
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = medications.patient_id
        AND p.created_by = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = medications.patient_id
        AND p.created_by = auth.uid()
    )
  );

-- Wards
DROP POLICY IF EXISTS "Authenticated users can view wards" ON public.wards;
DROP POLICY IF EXISTS "Admins can manage wards" ON public.wards;

CREATE POLICY "Users can view own wards" ON public.wards
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage own wards" ON public.wards
  FOR ALL TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Beds
DROP POLICY IF EXISTS "Authenticated users can view beds" ON public.beds;
DROP POLICY IF EXISTS "Authenticated users can update beds" ON public.beds;

CREATE POLICY "Users can view own beds" ON public.beds
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.wards w
      WHERE w.id = beds.ward_id
        AND w.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update own beds" ON public.beds
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.wards w
      WHERE w.id = beds.ward_id
        AND w.created_by = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.wards w
      WHERE w.id = beds.ward_id
        AND w.created_by = auth.uid()
    )
  );

-- Pharmacy inventory
DROP POLICY IF EXISTS "Authenticated users can view inventory" ON public.pharmacy_inventory;
DROP POLICY IF EXISTS "Authenticated users can insert inventory" ON public.pharmacy_inventory;
DROP POLICY IF EXISTS "Authenticated users can update inventory" ON public.pharmacy_inventory;
DROP POLICY IF EXISTS "Authenticated users can delete inventory" ON public.pharmacy_inventory;

CREATE POLICY "Users can view own inventory" ON public.pharmacy_inventory
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own inventory" ON public.pharmacy_inventory
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own inventory" ON public.pharmacy_inventory
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own inventory" ON public.pharmacy_inventory
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Pharmacy sales
DROP POLICY IF EXISTS "Authenticated users can view sales" ON public.pharmacy_sales;
DROP POLICY IF EXISTS "Authenticated users can insert sales" ON public.pharmacy_sales;

CREATE POLICY "Users can view own sales" ON public.pharmacy_sales
  FOR SELECT TO authenticated
  USING (sold_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own sales" ON public.pharmacy_sales
  FOR INSERT TO authenticated
  WITH CHECK (sold_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Pharmacy sale items
DROP POLICY IF EXISTS "Authenticated users can view sale items" ON public.pharmacy_sale_items;
DROP POLICY IF EXISTS "Authenticated users can insert sale items" ON public.pharmacy_sale_items;

CREATE POLICY "Users can view own sale items" ON public.pharmacy_sale_items
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.pharmacy_sales s
      WHERE s.id = pharmacy_sale_items.sale_id
        AND s.sold_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert own sale items" ON public.pharmacy_sale_items
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.pharmacy_sales s
      WHERE s.id = pharmacy_sale_items.sale_id
        AND s.sold_by = auth.uid()
    )
  );

-- Prescriptions
DROP POLICY IF EXISTS "Authenticated users can view prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Authenticated users can insert prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Authenticated users can update prescriptions" ON public.prescriptions;

CREATE POLICY "Users can view own prescriptions" ON public.prescriptions
  FOR SELECT TO authenticated
  USING (
    prescribed_by = auth.uid() OR
    dispensed_by = auth.uid() OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can insert own prescriptions" ON public.prescriptions
  FOR INSERT TO authenticated
  WITH CHECK (prescribed_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own prescriptions" ON public.prescriptions
  FOR UPDATE TO authenticated
  USING (
    prescribed_by = auth.uid() OR
    dispensed_by = auth.uid() OR
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    prescribed_by = auth.uid() OR
    dispensed_by = auth.uid() OR
    public.has_role(auth.uid(), 'admin')
  );

-- Lab templates
DROP POLICY IF EXISTS "Authenticated users can view templates" ON public.lab_test_templates;
DROP POLICY IF EXISTS "Authenticated users can insert templates" ON public.lab_test_templates;
DROP POLICY IF EXISTS "Authenticated users can update templates" ON public.lab_test_templates;
DROP POLICY IF EXISTS "Authenticated users can delete templates" ON public.lab_test_templates;

CREATE POLICY "Users can view own templates" ON public.lab_test_templates
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own templates" ON public.lab_test_templates
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own templates" ON public.lab_test_templates
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own templates" ON public.lab_test_templates
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Lab tests
DROP POLICY IF EXISTS "Authenticated users can view lab tests" ON public.lab_tests;
DROP POLICY IF EXISTS "Authenticated users can insert lab tests" ON public.lab_tests;
DROP POLICY IF EXISTS "Authenticated users can update lab tests" ON public.lab_tests;

CREATE POLICY "Users can view own lab tests" ON public.lab_tests
  FOR SELECT TO authenticated
  USING (ordered_by = auth.uid() OR performed_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own lab tests" ON public.lab_tests
  FOR INSERT TO authenticated
  WITH CHECK (ordered_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own lab tests" ON public.lab_tests
  FOR UPDATE TO authenticated
  USING (ordered_by = auth.uid() OR performed_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (ordered_by = auth.uid() OR performed_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Store invoices
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.store_invoices;
DROP POLICY IF EXISTS "Authenticated users can insert invoices" ON public.store_invoices;
DROP POLICY IF EXISTS "Authenticated users can update invoices" ON public.store_invoices;

CREATE POLICY "Users can view own invoices" ON public.store_invoices
  FOR SELECT TO authenticated
  USING (received_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own invoices" ON public.store_invoices
  FOR INSERT TO authenticated
  WITH CHECK (received_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own invoices" ON public.store_invoices
  FOR UPDATE TO authenticated
  USING (received_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (received_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Store invoice items
DROP POLICY IF EXISTS "Authenticated users can view invoice items" ON public.store_invoice_items;
DROP POLICY IF EXISTS "Authenticated users can insert invoice items" ON public.store_invoice_items;

CREATE POLICY "Users can view own invoice items" ON public.store_invoice_items
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.store_invoices i
      WHERE i.id = store_invoice_items.invoice_id
        AND i.received_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert own invoice items" ON public.store_invoice_items
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.store_invoices i
      WHERE i.id = store_invoice_items.invoice_id
        AND i.received_by = auth.uid()
    )
  );

-- Store transfers
DROP POLICY IF EXISTS "Authenticated users can view transfers" ON public.store_transfers;
DROP POLICY IF EXISTS "Authenticated users can insert transfers" ON public.store_transfers;

CREATE POLICY "Users can view own transfers" ON public.store_transfers
  FOR SELECT TO authenticated
  USING (transferred_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own transfers" ON public.store_transfers
  FOR INSERT TO authenticated
  WITH CHECK (transferred_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Notifications insert scoped to owner/admin
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;

CREATE POLICY "Users can insert own notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
