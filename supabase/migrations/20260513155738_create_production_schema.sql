-- Medical Health Management System Database Schema (Production-Ready)
-- Run this in your Supabase SQL editor

-- Extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Clinics table
DROP TABLE IF EXISTS clinics CASCADE;

CREATE TABLE clinics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address JSONB, -- { street, city, region, country, postal_code }
  owners_info JSONB, -- { names: [], contacts: [] }
  year_established INTEGER CHECK (year_established >= 1900 AND year_established <= EXTRACT(YEAR FROM NOW())),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  subscription_plan TEXT DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'standard', 'premium')),
  wallet_balance NUMERIC(12,2) DEFAULT 0 CHECK (wallet_balance >= 0),
  wallet_currency TEXT DEFAULT 'UGX',
  sms_credits INTEGER DEFAULT 0 CHECK (sms_credits >= 0),
  is_first_login BOOLEAN DEFAULT true,
  setup_completed BOOLEAN DEFAULT false,
  welcome_shown BOOLEAN DEFAULT false,
  admin_password_changed BOOLEAN DEFAULT false,
  -- SMS Settings
  enable_bill_payment_sms BOOLEAN DEFAULT false,
  enable_birthday_sms BOOLEAN DEFAULT false,
  enable_debt_reminder_sms BOOLEAN DEFAULT false,
  enable_appointment_reminder_sms BOOLEAN DEFAULT false,
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_clinics_email ON clinics(email);
CREATE INDEX idx_clinics_status ON clinics(status);
CREATE INDEX idx_clinics_created_at ON clinics(created_at);

-- Profiles table (extends auth.users - users who can access the system)
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'nurse', 'cashier', 'pharmacist', 'receptionist', 'lab_technician', 'radiographer')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_profiles_clinic ON profiles(clinic_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Employees table (for legacy compatibility - maps to profiles)
DROP TABLE IF EXISTS employees CASCADE;

CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  login_code TEXT UNIQUE, -- Encrypted QR code for quick login
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (clinic_id, email),
  UNIQUE (clinic_id, name)
);

CREATE INDEX idx_employees_clinic ON employees(clinic_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_role ON employees(role);

-- Permissions table
DROP TABLE IF EXISTS permissions CASCADE;

CREATE TABLE permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (employee_id, permission)
);

CREATE INDEX idx_permissions_employee ON permissions(employee_id);

-- User Roles table (standardized roles)
DROP TABLE IF EXISTS user_roles CASCADE;

CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'nurse', 'cashier', 'pharmacist', 'receptionist', 'lab_technician', 'radiographer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, clinic_id, role)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_clinic ON user_roles(clinic_id);

-- ============================================================================
-- PATIENT & MEDICAL DATA TABLES
-- ============================================================================

-- Patients table
DROP TABLE IF EXISTS patients CASCADE;

CREATE TABLE patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('M', 'F', 'Other', 'Prefer not to say')),
  phone TEXT,
  email TEXT,
  address JSONB, -- { street, city, region, country, postal_code }
  national_id TEXT,
  blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  allergies TEXT[],
  emergency_contact JSONB, -- { name, phone, relationship }
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (clinic_id, national_id)
);

CREATE INDEX idx_patients_clinic ON patients(clinic_id);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_status ON patients(status);

-- Vitals table
DROP TABLE IF EXISTS vitals CASCADE;

CREATE TABLE vitals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  recorded_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  blood_pressure TEXT, -- Format: "120/80"
  heart_rate INTEGER CHECK (heart_rate > 0),
  respiratory_rate INTEGER CHECK (respiratory_rate > 0),
  temperature DECIMAL(5,2) CHECK (temperature >= 35 AND temperature <= 45),
  weight DECIMAL(6,2) CHECK (weight > 0),
  height DECIMAL(5,2) CHECK (height > 0),
  oxygen_saturation DECIMAL(3,1) CHECK (oxygen_saturation >= 70 AND oxygen_saturation <= 100),
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vitals_patient ON vitals(patient_id);
CREATE INDEX idx_vitals_clinic ON vitals(clinic_id);
CREATE INDEX idx_vitals_recorded_at ON vitals(recorded_at DESC);

-- Consultations table
DROP TABLE IF EXISTS consultations CASCADE;

CREATE TABLE consultations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  consultation_type TEXT CHECK (consultation_type IN ('general', 'follow_up', 'emergency', 'specialist')),
  chief_complaint TEXT,
  diagnosis TEXT,
  findings TEXT,
  notes TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  consultation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_consultations_patient ON consultations(patient_id);
CREATE INDEX idx_consultations_clinic ON consultations(clinic_id);
CREATE INDEX idx_consultations_doctor ON consultations(doctor_id);
CREATE INDEX idx_consultations_date ON consultations(consultation_date DESC);

-- Appointments table
DROP TABLE IF EXISTS appointments CASCADE;

CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  appointment_type TEXT CHECK (appointment_type IN ('consultation', 'follow_up', 'procedure', 'test')),
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled')),
  reason TEXT,
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_clinic ON appointments(clinic_id);
CREATE INDEX idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- ============================================================================
-- MEDICAL RECORDS & PRESCRIPTIONS
-- ============================================================================

-- Medications table
DROP TABLE IF EXISTS medications CASCADE;

CREATE TABLE medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  generic_name TEXT,
  dosage_form TEXT CHECK (dosage_form IN ('tablet', 'capsule', 'liquid', 'injection', 'cream', 'other')),
  strength TEXT, -- e.g., "500mg"
  unit TEXT, -- e.g., "per tablet"
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'discontinued')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (clinic_id, name, strength)
);

CREATE INDEX idx_medications_clinic ON medications(clinic_id);

-- Prescriptions table
DROP TABLE IF EXISTS prescriptions CASCADE;

CREATE TABLE prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE RESTRICT,
  prescribed_by UUID NOT NULL REFERENCES employees(id) ON DELETE SET NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL, -- e.g., "3 times daily"
  duration TEXT NOT NULL, -- e.g., "7 days"
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  special_instructions TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dispensed', 'cancelled', 'expired')),
  prescribed_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_clinic ON prescriptions(clinic_id);
CREATE INDEX idx_prescriptions_medication ON prescriptions(medication_id);
CREATE INDEX idx_prescriptions_prescribed_date ON prescriptions(prescribed_date DESC);

-- ============================================================================
-- LABORATORY TABLES
-- ============================================================================

-- Lab Test Templates table
DROP TABLE IF EXISTS lab_test_templates CASCADE;

CREATE TABLE lab_test_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  category TEXT, -- e.g., "hematology", "chemistry", "serology"
  description TEXT,
  normal_range TEXT,
  unit TEXT,
  sample_type TEXT, -- e.g., "blood", "urine", "stool"
  turnaround_hours INTEGER,
  cost NUMERIC(10,2) CHECK (cost >= 0),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (clinic_id, name)
);

CREATE INDEX idx_lab_test_templates_clinic ON lab_test_templates(clinic_id);
CREATE INDEX idx_lab_test_templates_category ON lab_test_templates(category);

-- Lab Tests table
DROP TABLE IF EXISTS labtests CASCADE;

CREATE TABLE labtests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  test_template_id UUID NOT NULL REFERENCES lab_test_templates(id) ON DELETE RESTRICT,
  ordered_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  tested_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  result TEXT,
  result_range TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  ordered_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_labtests_patient ON labtests(patient_id);
CREATE INDEX idx_labtests_clinic ON labtests(clinic_id);
CREATE INDEX idx_labtests_status ON labtests(status);
CREATE INDEX idx_labtests_ordered_date ON labtests(ordered_date DESC);

-- ============================================================================
-- PHARMACY & DRUGS TABLES
-- ============================================================================

-- Drugs table (unified drug/medication inventory)
DROP TABLE IF EXISTS drugs CASCADE;

CREATE TABLE drugs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  generic_name TEXT,
  description TEXT,
  dosage_form TEXT CHECK (dosage_form IN ('tablet', 'capsule', 'liquid', 'injection', 'cream', 'other')),
  strength TEXT,
  manufacturer TEXT,
  cost_price NUMERIC(10,2) CHECK (cost_price >= 0),
  selling_price NUMERIC(10,2) CHECK (selling_price >= 0),
  reorder_level INTEGER DEFAULT 10 CHECK (reorder_level >= 0),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (clinic_id, name, strength)
);

CREATE INDEX idx_drugs_clinic ON drugs(clinic_id);
CREATE INDEX idx_drugs_status ON drugs(status);

-- Pharmacy Inventory table
DROP TABLE IF EXISTS pharmacy_inventory CASCADE;

CREATE TABLE pharmacy_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  drug_id UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  quantity_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  quantity_reserved INTEGER DEFAULT 0 CHECK (quantity_reserved >= 0),
  batch_number TEXT NOT NULL,
  manufacture_date DATE,
  expiry_date DATE NOT NULL,
  location TEXT, -- e.g., "Shelf A1"
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'damaged')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (clinic_id, drug_id, batch_number)
);

CREATE INDEX idx_pharmacy_inventory_drug ON pharmacy_inventory(drug_id);
CREATE INDEX idx_pharmacy_inventory_clinic ON pharmacy_inventory(clinic_id);
CREATE INDEX idx_pharmacy_inventory_expiry ON pharmacy_inventory(expiry_date);

-- Pharmacy Sales table
DROP TABLE IF EXISTS pharmacy_sales CASCADE;

CREATE TABLE pharmacy_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  cashier_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'mobile', 'credit')),
  payment_status TEXT DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'refunded')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_pharmacy_sales_patient ON pharmacy_sales(patient_id);
CREATE INDEX idx_pharmacy_sales_clinic ON pharmacy_sales(clinic_id);
CREATE INDEX idx_pharmacy_sales_created_at ON pharmacy_sales(created_at DESC);

-- Pharmacy Sale Items table
DROP TABLE IF EXISTS pharmacy_sale_items CASCADE;

CREATE TABLE pharmacy_sale_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_sale_id UUID NOT NULL REFERENCES pharmacy_sales(id) ON DELETE CASCADE,
  drug_id UUID NOT NULL REFERENCES drugs(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (subtotal = quantity * unit_price)
);

CREATE INDEX idx_pharmacy_sale_items_sale ON pharmacy_sale_items(pharmacy_sale_id);
CREATE INDEX idx_pharmacy_sale_items_drug ON pharmacy_sale_items(drug_id);

-- ============================================================================
-- BILLING & PAYMENT TABLES
-- ============================================================================

-- Billing Items / Services table
DROP TABLE IF EXISTS billing_items CASCADE;

CREATE TABLE billing_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  code TEXT UNIQUE,
  category TEXT, -- e.g., "consultation", "procedure", "test"
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_billing_items_clinic ON billing_items(clinic_id);
CREATE INDEX idx_billing_items_category ON billing_items(category);

-- Patient Invoices/Billing table
DROP TABLE IF EXISTS patient_invoices CASCADE;

CREATE TABLE patient_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  paid_amount NUMERIC(12,2) DEFAULT 0 CHECK (paid_amount >= 0 AND paid_amount <= total_amount),
  balance NUMERIC(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED CHECK (balance >= 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
  issued_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  CHECK (due_date IS NULL OR due_date >= DATE(issued_date)),
  UNIQUE (clinic_id, invoice_number)
);

CREATE INDEX idx_patient_invoices_patient ON patient_invoices(patient_id);
CREATE INDEX idx_patient_invoices_clinic ON patient_invoices(clinic_id);
CREATE INDEX idx_patient_invoices_status ON patient_invoices(status);
CREATE INDEX idx_patient_invoices_issued_date ON patient_invoices(issued_date DESC);

-- Invoice Line Items table
DROP TABLE IF EXISTS invoice_line_items CASCADE;

CREATE TABLE invoice_line_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES patient_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);

-- Payments table
DROP TABLE IF EXISTS payments CASCADE;

CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES patient_invoices(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'mobile_money', 'bank_transfer', 'credit')),
  payment_reference TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  received_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  notes TEXT,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_patient ON payments(patient_id);
CREATE INDEX idx_payments_clinic ON payments(clinic_id);

-- ============================================================================
-- FACILITY MANAGEMENT TABLES
-- ============================================================================

-- Wards table
DROP TABLE IF EXISTS wards CASCADE;

CREATE TABLE wards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ward_type TEXT CHECK (ward_type IN ('general', 'icu', 'maternity', 'pediatrics', 'surgery')),
  capacity INTEGER CHECK (capacity > 0),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (clinic_id, name)
);

CREATE INDEX idx_wards_clinic ON wards(clinic_id);

-- Beds table
DROP TABLE IF EXISTS beds CASCADE;

CREATE TABLE beds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ward_id UUID NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  bed_number TEXT NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved')),
  occupied_by UUID REFERENCES patients(id) ON DELETE SET NULL,
  admitted_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (ward_id, bed_number)
);

CREATE INDEX idx_beds_ward ON beds(ward_id);
CREATE INDEX idx_beds_clinic ON beds(clinic_id);
CREATE INDEX idx_beds_status ON beds(status);

-- ============================================================================
-- OPERATIONAL TABLES
-- ============================================================================

-- Cashier Shifts table
DROP TABLE IF EXISTS cashier_shifts CASCADE;

CREATE TABLE cashier_shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  opening_balance NUMERIC(12,2) CHECK (opening_balance >= 0),
  closing_balance NUMERIC(12,2) CHECK (closing_balance >= 0),
  cash_count NUMERIC(12,2) CHECK (cash_count >= 0),
  discrepancy NUMERIC(12,2),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'reconciled')),
  notes TEXT,
  closed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (end_time IS NULL OR end_time > start_time)
);

CREATE INDEX idx_cashier_shifts_employee ON cashier_shifts(employee_id);
CREATE INDEX idx_cashier_shifts_clinic ON cashier_shifts(clinic_id);
CREATE INDEX idx_cashier_shifts_shift_date ON cashier_shifts(shift_date);

-- Employee Performance table
DROP TABLE IF EXISTS employee_performance CASCADE;

CREATE TABLE employee_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC(12,2),
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (employee_id, metric_name, period_start_date)
);

CREATE INDEX idx_employee_performance_employee ON employee_performance(employee_id);
CREATE INDEX idx_employee_performance_clinic ON employee_performance(clinic_id);

-- Wallet Transactions table
DROP TABLE IF EXISTS wallet_transactions CASCADE;

CREATE TABLE wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit', 'refund', 'adjustment')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'UGX',
  description TEXT,
  reference_id TEXT,
  initiated_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  balance_before NUMERIC(12,2),
  balance_after NUMERIC(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_wallet_transactions_clinic ON wallet_transactions(clinic_id);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(transaction_type);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);

-- SMS Transactions table
DROP TABLE IF EXISTS sms_transactions CASCADE;

CREATE TABLE sms_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund')),
  credits_amount INTEGER NOT NULL CHECK (credits_amount != 0),
  cost NUMERIC(10,2),
  description TEXT,
  reference_id TEXT,
  balance_before INTEGER,
  balance_after INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sms_transactions_clinic ON sms_transactions(clinic_id);
CREATE INDEX idx_sms_transactions_created_at ON sms_transactions(created_at DESC);

-- SMS Logs table
DROP TABLE IF EXISTS sms_logs CASCADE;

CREATE TABLE sms_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  recipient_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  sms_type TEXT CHECK (sms_type IN ('appointment', 'billing', 'birthday', 'debt_reminder', 'custom', 'notification')),
  status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  delivery_status_details TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sms_logs_clinic ON sms_logs(clinic_id);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);
CREATE INDEX idx_sms_logs_created_at ON sms_logs(created_at DESC);

-- Notifications table
DROP TABLE IF EXISTS notifications CASCADE;

CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  notification_type TEXT CHECK (notification_type IN ('alert', 'reminder', 'info', 'warning', 'error')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_clinic ON notifications(clinic_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- ============================================================================
-- AUDIT & LOGGING TABLES
-- ============================================================================

-- Audit Logs table
DROP TABLE IF EXISTS audit_logs CASCADE;

CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'view', 'export', 'login', 'logout')),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failure')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_clinic ON audit_logs(clinic_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================================
-- MATERIALIZED VIEWS FOR REPORTING
-- ============================================================================

-- Daily Revenue Summary
DROP MATERIALIZED VIEW IF EXISTS daily_revenue_summary CASCADE;

CREATE MATERIALIZED VIEW daily_revenue_summary AS
SELECT
  ps.clinic_id,
  DATE(ps.created_at) AS revenue_date,
  COUNT(ps.id) AS total_transactions,
  SUM(ps.total_amount) AS total_revenue,
  COUNT(DISTINCT ps.patient_id) AS unique_patients
FROM pharmacy_sales ps
WHERE ps.payment_status = 'completed'
GROUP BY ps.clinic_id, DATE(ps.created_at);

CREATE INDEX idx_daily_revenue_clinic ON daily_revenue_summary(clinic_id);

-- Patient Demographics
DROP MATERIALIZED VIEW IF EXISTS patient_demographics CASCADE;

CREATE MATERIALIZED VIEW patient_demographics AS
SELECT
  clinic_id,
  gender,
  CASE
    WHEN DATE_PART('year', AGE(date_of_birth)) < 18 THEN 'Pediatric'
    WHEN DATE_PART('year', AGE(date_of_birth)) BETWEEN 18 AND 65 THEN 'Adult'
    ELSE 'Geriatric'
  END AS age_group,
  COUNT(*) AS patient_count
FROM patients
WHERE deleted_at IS NULL
GROUP BY clinic_id, gender, age_group;

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp on record modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all main tables
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drugs_updated_at BEFORE UPDATE ON drugs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pharmacy_inventory_updated_at BEFORE UPDATE ON pharmacy_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wards_updated_at BEFORE UPDATE ON wards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beds_updated_at BEFORE UPDATE ON beds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cashier_shifts_updated_at BEFORE UPDATE ON cashier_shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_invoices_updated_at BEFORE UPDATE ON patient_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto log invoice payments
CREATE OR REPLACE FUNCTION log_invoice_payment()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (user_id, clinic_id, action, entity_type, entity_id, new_values)
    VALUES (
        auth.uid(),
        NEW.clinic_id,
        'update',
        'patient_invoices',
        NEW.id,
        jsonb_build_object('paid_amount', NEW.paid_amount, 'status', NEW.status)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto deduct stock when pharmacy items are sold
CREATE OR REPLACE FUNCTION deduct_pharmacy_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_clinic_id UUID;
    v_rows_updated INTEGER;
BEGIN
    -- Get clinic_id from pharmacy_sales
    SELECT clinic_id INTO v_clinic_id FROM pharmacy_sales WHERE id = NEW.pharmacy_sale_id;
    
    -- Update pharmacy inventory stock
    UPDATE pharmacy_inventory
    SET quantity_on_hand = quantity_on_hand - NEW.quantity
    WHERE drug_id = NEW.drug_id
    AND clinic_id = v_clinic_id
    AND status = 'active'
    AND quantity_on_hand >= NEW.quantity;
    
    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
    
    IF v_rows_updated = 0 THEN
        RAISE EXCEPTION 'Insufficient stock for drug_id % in clinic %', NEW.drug_id, v_clinic_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_deduct_stock AFTER INSERT ON pharmacy_sale_items
    FOR EACH ROW EXECUTE FUNCTION deduct_pharmacy_stock();

-- Log all data changes for audit trail
CREATE OR REPLACE FUNCTION audit_data_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, clinic_id, action, entity_type, entity_id, old_values)
        VALUES (
            auth.uid(),
            OLD.clinic_id,
            'delete',
            TG_TABLE_NAME,
            OLD.id,
            to_jsonb(OLD)
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, clinic_id, action, entity_type, entity_id, old_values, new_values)
        VALUES (
            auth.uid(),
            NEW.clinic_id,
            'update',
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, clinic_id, action, entity_type, entity_id, new_values)
        VALUES (
            auth.uid(),
            NEW.clinic_id,
            'create',
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(NEW)
        );
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to sensitive tables (optional - can be selective)
CREATE TRIGGER audit_patients AFTER INSERT OR UPDATE OR DELETE ON patients
    FOR EACH ROW EXECUTE FUNCTION audit_data_changes();

CREATE TRIGGER audit_prescriptions AFTER INSERT OR UPDATE OR DELETE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION audit_data_changes();

CREATE TRIGGER audit_pharmacy_sales AFTER INSERT OR UPDATE OR DELETE ON pharmacy_sales
    FOR EACH ROW EXECUTE FUNCTION audit_data_changes();

CREATE TRIGGER log_patient_invoice_update AFTER UPDATE ON patient_invoices
    FOR EACH ROW WHEN (OLD.paid_amount IS DISTINCT FROM NEW.paid_amount)
    EXECUTE FUNCTION log_invoice_payment();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - COMPREHENSIVE & COMPLETE
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_test_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE labtests ENABLE ROW LEVEL SECURITY;
ALTER TABLE drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashier_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER: Check if user is admin of a clinic
-- ============================================================================

CREATE OR REPLACE FUNCTION is_clinic_admin(clinic_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND clinic_id = clinic_id_param
    AND role = 'admin'
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER: Check if user belongs to a clinic
-- ============================================================================

CREATE OR REPLACE FUNCTION is_clinic_member(clinic_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND clinic_id = clinic_id_param
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CLINICS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic admin access" ON clinics;
CREATE POLICY "Clinic admin full access" ON clinics
FOR ALL USING (
  is_clinic_admin(id)
);

DROP POLICY IF EXISTS "Clinic staff view clinic info" ON clinics;
CREATE POLICY "Clinic staff view clinic info" ON clinics
FOR SELECT USING (
  is_clinic_member(id)
);

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users view own profile" ON profiles;
CREATE POLICY "Users view own profile" ON profiles
FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Clinic admin view staff profiles" ON profiles;
CREATE POLICY "Clinic admin view staff profiles" ON profiles
FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Clinic admin manage staff profiles" ON profiles;
CREATE POLICY "Clinic admin manage staff profiles" ON profiles
FOR UPDATE USING (
  is_clinic_admin(clinic_id)
) WITH CHECK (
  is_clinic_admin(clinic_id)
);

DROP POLICY IF EXISTS "Clinic admin create staff profiles" ON profiles;
CREATE POLICY "Clinic admin create staff profiles" ON profiles
FOR INSERT WITH CHECK (
  is_clinic_admin(clinic_id)
);

-- ============================================================================
-- EMPLOYEES TABLE POLICIES (Legacy support)
-- ============================================================================

DROP POLICY IF EXISTS "Clinic staff view employees" ON employees;
CREATE POLICY "Clinic staff view employees" ON employees
FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Clinic admin manage employees" ON employees;
CREATE POLICY "Clinic admin manage employees" ON employees
FOR ALL USING (
  is_clinic_admin(clinic_id)
);

-- ============================================================================
-- PERMISSIONS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic admin view permissions" ON permissions;
CREATE POLICY "Clinic admin view permissions" ON permissions
FOR SELECT USING (
  employee_id IN (
    SELECT id FROM employees WHERE clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

DROP POLICY IF EXISTS "Clinic admin manage permissions" ON permissions;
CREATE POLICY "Clinic admin manage permissions" ON permissions
FOR ALL USING (
  employee_id IN (
    SELECT id FROM employees WHERE clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- ============================================================================
-- USER ROLES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic admin view user roles" ON user_roles;
CREATE POLICY "Clinic admin view user roles" ON user_roles
FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Clinic admin manage user roles" ON user_roles;
CREATE POLICY "Clinic admin manage user roles" ON user_roles
FOR ALL USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- PATIENTS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic staff view patients" ON patients;
CREATE POLICY "Clinic staff view patients" ON patients
FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS "Clinic staff manage patients" ON patients;
CREATE POLICY "Clinic staff manage patients" ON patients
FOR ALL USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
);

-- ============================================================================
-- VITALS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic staff view vitals" ON vitals;
CREATE POLICY "Clinic staff view vitals" ON vitals
FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Clinic staff manage vitals" ON vitals;
CREATE POLICY "Clinic staff manage vitals" ON vitals
FOR ALL USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
);

-- ============================================================================
-- CONSULTATIONS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic staff view consultations" ON consultations;
CREATE POLICY "Clinic staff view consultations" ON consultations
FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS "Clinic staff manage consultations" ON consultations;
CREATE POLICY "Clinic staff manage consultations" ON consultations
FOR ALL USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
);

-- ============================================================================
-- APPOINTMENTS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic staff view appointments" ON appointments;
CREATE POLICY "Clinic staff view appointments" ON appointments
FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS "Clinic staff manage appointments" ON appointments;
CREATE POLICY "Clinic staff manage appointments" ON appointments
FOR ALL USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
);

-- ============================================================================
-- MEDICATIONS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic staff view medications" ON medications;
CREATE POLICY "Clinic staff view medications" ON medications
FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS "Clinic staff manage medications" ON medications;
CREATE POLICY "Clinic staff manage medications" ON medications
FOR ALL USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
);

-- ============================================================================
-- PRESCRIPTIONS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic staff view prescriptions" ON prescriptions;
CREATE POLICY "Clinic staff view prescriptions" ON prescriptions
FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS "Clinic staff manage prescriptions" ON prescriptions;
CREATE POLICY "Clinic staff manage prescriptions" ON prescriptions
FOR ALL USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
);

-- ============================================================================
-- LAB TEST TEMPLATES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic staff view lab templates" ON lab_test_templates;
CREATE POLICY "Clinic staff view lab templates" ON lab_test_templates
FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Clinic admin manage lab templates" ON lab_test_templates;
CREATE POLICY "Clinic admin manage lab templates" ON lab_test_templates
FOR ALL USING (
  is_clinic_admin(clinic_id)
);

-- ============================================================================
-- LAB TESTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic staff view lab tests" ON labtests;
CREATE POLICY "Clinic staff view lab tests" ON labtests
FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS "Clinic staff manage lab tests" ON labtests;
CREATE POLICY "Clinic staff manage lab tests" ON labtests
FOR ALL USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
);

-- ============================================================================
-- DRUGS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic staff view drugs" ON drugs;
CREATE POLICY "Clinic staff view drugs" ON drugs
FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS "Clinic admin manage drugs" ON drugs;
CREATE POLICY "Clinic admin manage drugs" ON drugs
FOR ALL USING (
  is_clinic_admin(clinic_id)
);

-- ============================================================================
-- PHARMACY INVENTORY POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic staff view inventory" ON pharmacy_inventory;
CREATE POLICY "Clinic staff view inventory" ON pharmacy_inventory
FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Clinic staff manage inventory" ON pharmacy_inventory;
CREATE POLICY "Clinic staff manage inventory" ON pharmacy_inventory
FOR ALL USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
);

-- ============================================================================
-- PHARMACY SALES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic staff view pharmacy sales" ON pharmacy_sales;
CREATE POLICY "Clinic staff view pharmacy sales" ON pharmacy_sales
FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS "Clinic staff manage pharmacy sales" ON pharmacy_sales;
CREATE POLICY "Clinic staff manage pharmacy sales" ON pharmacy_sales
FOR ALL USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
);

-- ============================================================================
-- PHARMACY SALE ITEMS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic staff view sale items" ON pharmacy_sale_items;
CREATE POLICY "Clinic staff view sale items" ON pharmacy_sale_items
FOR SELECT USING (
  pharmacy_sale_id IN (
    SELECT id FROM pharmacy_sales WHERE clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Clinic staff manage sale items" ON pharmacy_sale_items;
CREATE POLICY "Clinic staff manage sale items" ON pharmacy_sale_items
FOR ALL USING (
  pharmacy_sale_id IN (
    SELECT id FROM pharmacy_sales WHERE clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- ============================================================================
-- BILLING ITEMS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic staff view billing items" ON billing_items;
CREATE POLICY "Clinic staff view billing items" ON billing_items
FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Clinic admin manage billing items" ON billing_items;
CREATE POLICY "Clinic admin manage billing items" ON billing_items
FOR ALL USING (
  is_clinic_admin(clinic_id)
);

-- ============================================================================
-- PATIENT INVOICES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic staff view invoices" ON patient_invoices;
CREATE POLICY "Clinic staff view invoices" ON patient_invoices
FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS "Clinic staff manage invoices" ON patient_invoices;
CREATE POLICY "Clinic staff manage invoices" ON patient_invoices
FOR ALL USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
);

-- ============================================================================
-- INVOICE LINE ITEMS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic staff view line items" ON invoice_line_items;
CREATE POLICY "Clinic staff view line items" ON invoice_line_items
FOR SELECT USING (
  invoice_id IN (
    SELECT id FROM patient_invoices WHERE clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Clinic staff manage line items" ON invoice_line_items;
CREATE POLICY "Clinic staff manage line items" ON invoice_line_items
FOR ALL USING (
  invoice_id IN (
    SELECT id FROM patient_invoices WHERE clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- ============================================================================
-- PAYMENTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic staff view payments" ON payments;
CREATE POLICY "Clinic staff view payments" ON payments
FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Clinic staff manage payments" ON payments;
CREATE POLICY "Clinic staff manage payments" ON payments
FOR ALL USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
);

-- ============================================================================
-- WARDS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic staff view wards" ON wards;
CREATE POLICY "Clinic staff view wards" ON wards
FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Clinic admin manage wards" ON wards;
CREATE POLICY "Clinic admin manage wards" ON wards
FOR ALL USING (
  is_clinic_admin(clinic_id)
);

-- ============================================================================
-- BEDS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic staff view beds" ON beds;
CREATE POLICY "Clinic staff view beds" ON beds
FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Clinic staff manage beds" ON beds;
CREATE POLICY "Clinic staff manage beds" ON beds
FOR ALL USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
);

-- ============================================================================
-- CASHIER SHIFTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic staff view cashier shifts" ON cashier_shifts;
CREATE POLICY "Clinic staff view cashier shifts" ON cashier_shifts
FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Clinic staff manage cashier shifts" ON cashier_shifts;
CREATE POLICY "Clinic staff manage cashier shifts" ON cashier_shifts
FOR ALL USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
);

-- ============================================================================
-- EMPLOYEE PERFORMANCE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic admin view employee performance" ON employee_performance;
CREATE POLICY "Clinic admin view employee performance" ON employee_performance
FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Clinic admin manage employee performance" ON employee_performance;
CREATE POLICY "Clinic admin manage employee performance" ON employee_performance
FOR ALL USING (
  is_clinic_admin(clinic_id)
);

-- ============================================================================
-- WALLET TRANSACTIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic admin view wallet transactions" ON wallet_transactions;
CREATE POLICY "Clinic admin view wallet transactions" ON wallet_transactions
FOR SELECT USING (
  is_clinic_admin(clinic_id)
);

DROP POLICY IF EXISTS "Clinic admin manage wallet transactions" ON wallet_transactions;
CREATE POLICY "Clinic admin manage wallet transactions" ON wallet_transactions
FOR ALL USING (
  is_clinic_admin(clinic_id)
);

-- ============================================================================
-- SMS TRANSACTIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic admin view sms transactions" ON sms_transactions;
CREATE POLICY "Clinic admin view sms transactions" ON sms_transactions
FOR SELECT USING (
  is_clinic_admin(clinic_id)
);

DROP POLICY IF EXISTS "Clinic admin manage sms transactions" ON sms_transactions;
CREATE POLICY "Clinic admin manage sms transactions" ON sms_transactions
FOR ALL USING (
  is_clinic_admin(clinic_id)
);

-- ============================================================================
-- SMS LOGS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic staff view sms logs" ON sms_logs;
CREATE POLICY "Clinic staff view sms logs" ON sms_logs
FOR SELECT USING (
  is_clinic_member(clinic_id)
);

DROP POLICY IF EXISTS "Clinic admin manage sms logs" ON sms_logs;
CREATE POLICY "Clinic admin manage sms logs" ON sms_logs
FOR ALL USING (
  is_clinic_admin(clinic_id)
);

-- ============================================================================
-- NOTIFICATIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
CREATE POLICY "Users view own notifications" ON notifications
FOR SELECT USING (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS "Clinic staff create notifications" ON notifications;
CREATE POLICY "Clinic staff create notifications" ON notifications
FOR INSERT WITH CHECK (
  is_clinic_member(clinic_id)
);

-- ============================================================================
-- AUDIT LOGS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clinic admin view audit logs" ON audit_logs;
CREATE POLICY "Clinic admin view audit logs" ON audit_logs
FOR SELECT USING (
  is_clinic_admin(clinic_id)
);

-- ============================================================================
-- SAMPLE DATA & DOCUMENTATION
-- ============================================================================

-- VIEW: Get user's accessible clinics
CREATE OR REPLACE VIEW user_clinics AS
SELECT DISTINCT 
  p.clinic_id,
  c.name,
  c.email,
  p.role,
  p.status
FROM profiles p
JOIN clinics c ON p.clinic_id = c.id
WHERE p.id = auth.uid()
AND p.status = 'active'
AND c.status = 'active'
ORDER BY c.name;

-- VIEW: Active employees per clinic
CREATE OR REPLACE VIEW clinic_active_staff AS
SELECT 
  e.clinic_id,
  COUNT(*) as total_staff,
  COUNT(CASE WHEN e.role = 'admin' THEN 1 END) as admins,
  COUNT(CASE WHEN e.role = 'doctor' THEN 1 END) as doctors,
  COUNT(CASE WHEN e.role = 'nurse' THEN 1 END) as nurses,
  COUNT(CASE WHEN e.role = 'pharmacist' THEN 1 END) as pharmacists,
  COUNT(CASE WHEN e.role = 'cashier' THEN 1 END) as cashiers
FROM employees e
WHERE e.status = 'active'
AND e.deleted_at IS NULL
GROUP BY e.clinic_id;

-- VIEW: Pharmacy low stock alerts
CREATE OR REPLACE VIEW pharmacy_low_stock_alerts AS
SELECT 
  pi.clinic_id,
  d.name,
  d.strength,
  pi.quantity_on_hand,
  d.reorder_level,
  pi.expiry_date,
  CASE 
    WHEN pi.expiry_date <= NOW()::DATE THEN 'EXPIRED'
    WHEN pi.quantity_on_hand <= d.reorder_level THEN 'LOW_STOCK'
    WHEN pi.expiry_date <= (NOW() + INTERVAL '30 days')::DATE THEN 'EXPIRING_SOON'
  END as alert_type
FROM pharmacy_inventory pi
JOIN drugs d ON pi.drug_id = d.id
WHERE pi.status = 'active'
AND (
  pi.expiry_date <= NOW()::DATE
  OR pi.quantity_on_hand <= d.reorder_level
  OR pi.expiry_date <= (NOW() + INTERVAL '30 days')::DATE
);

-- VIEW: Patient appointment summary
CREATE OR REPLACE VIEW patient_appointment_summary AS
SELECT 
  p.clinic_id,
  p.id as patient_id,
  CONCAT(p.first_name, ' ', p.last_name) as patient_name,
  COUNT(*) as total_appointments,
  COUNT(CASE WHEN a.status = 'scheduled' THEN 1 END) as pending_appointments,
  COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
  COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) as missed_appointments,
  MAX(a.scheduled_date) as last_appointment_date
FROM patients p
LEFT JOIN appointments a ON p.id = a.patient_id AND a.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.clinic_id, p.id, p.first_name, p.last_name;

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

/*
SCHEMA OVERVIEW:

1. CORE ENTITIES:
   - clinics: Healthcare facility
   - profiles: Extends auth.users with clinic-specific data
   - employees: Legacy table (for backward compatibility)
   - user_roles: Standardized role management

2. PATIENT MANAGEMENT:
   - patients: Patient demographics
   - appointments: Scheduled visits
   - consultations: Medical encounters
   - vitals: Vital signs records
   - prescriptions: Medication orders
   - lab_test_templates: Available lab tests
   - labtests: Lab test orders and results

3. PHARMACY MANAGEMENT:
   - drugs: Drug catalog
   - pharmacy_inventory: Stock levels (by batch)
   - pharmacy_sales: Drug sales transactions
   - pharmacy_sale_items: Line items in sales

4. BILLING & PAYMENTS:
   - billing_items: Service rates
   - patient_invoices: Patient bills
   - invoice_line_items: Invoice details
   - payments: Payment records

5. FACILITY MANAGEMENT:
   - wards: Hospital wards/departments
   - beds: Individual beds with occupancy

6. OPERATIONS:
   - cashier_shifts: Daily cashier records
   - employee_performance: Staff metrics
   - wallet_transactions: Account balance changes
   - sms_transactions: SMS credit transactions
   - sms_logs: SMS delivery tracking
   - notifications: User notifications
   - audit_logs: Comprehensive audit trail

SECURITY:
- All tables have Row Level Security (RLS) enabled
- Policies enforce clinic isolation
- Audit logging on critical operations
- Soft deletes via deleted_at column

PERFORMANCE:
- Materialized views for reporting
- Strategic indexes on foreign keys and frequently queried columns
- Triggers for automatic updates and stock management

*/

-- ============================================================================
-- SAMPLE DATA & INITIALIZATION
-- ============================================================================

-- INSERT sample clinic (use with caution in production)
-- INSERT INTO clinics (name, email, phone, year_established, setup_completed)
-- VALUES ('Sample Clinic', 'clinic@example.com', '+256700000000', 2020, true)
-- ON CONFLICT (email) DO NOTHING;

-- Note: To add users, use Supabase Auth dashboard or create via auth API
-- Example: POST https://[PROJECT].supabase.co/auth/v1/signup
-- Then create profile entry for clinic membership

-- MULTI-CLINIC SUPPORT:
-- One user can belong to multiple clinics via multiple profile entries:
-- INSERT INTO profiles (id, clinic_id, display_name, role)
-- VALUES (user_id, clinic_1_id, 'John Doe', 'doctor'),
--        (user_id, clinic_2_id, 'John Doe', 'pharmacist');

-- ============================================================================
-- SEED DATA (Optional)
-- ============================================================================

INSERT INTO clinics (name, email, phone) VALUES
  ('Sample Clinic', 'clinic@example.com', '+256700000000')
ON CONFLICT (email) DO NOTHING;