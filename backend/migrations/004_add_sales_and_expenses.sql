-- Migration: Add Legacy Sales Support
-- Purpose: Add legacy sales table for financial history and reporting
-- Created: 2026-05-23
-- Note: Expenses table is defined in main schema. Sales is legacy support.

-- Legacy Sales table for financial dashboard compatibility
DROP TABLE IF EXISTS sales CASCADE;

CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  cashier_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  category TEXT,
  reason TEXT,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'mobile', 'credit', 'insurance', 'other')),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'cancelled')),
  shift TEXT,
  served_by TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sales_clinic ON sales(clinic_id);
CREATE INDEX idx_sales_patient ON sales(patient_id);
CREATE INDEX idx_sales_date ON sales(date DESC);
CREATE INDEX idx_sales_category ON sales(category);
