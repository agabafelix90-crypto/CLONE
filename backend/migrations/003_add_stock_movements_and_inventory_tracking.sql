-- Migration: Add Stock Movements and Enhanced Inventory Tracking
-- Purpose: Add tracking for pharmacy stock movements, transfers, and inventory adjustments
-- Created: 2026-05-23

-- ============================================================================
-- STOCK MOVEMENTS TABLE
-- ============================================================================
-- Tracks all pharmacy stock movements: receipts, transfers, adjustments, losses
DROP TABLE IF EXISTS stock_movements CASCADE;

CREATE TABLE stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  drug_id UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  from_location TEXT, -- 'STORE', 'SHELVES', 'DISPOSAL', NULL for new receipts
  to_location TEXT,   -- 'STORE', 'SHELVES', 'DISPOSAL'
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('receipt', 'transfer', 'adjustment', 'loss', 'disposal', 'return')),
  recorded_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  batch_number TEXT,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_clinic ON stock_movements(clinic_id);
CREATE INDEX idx_stock_movements_drug ON stock_movements(drug_id);
CREATE INDEX idx_stock_movements_movement_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX idx_stock_movements_location ON stock_movements(from_location, to_location);

-- ============================================================================
-- ENHANCED INVENTORY LOCATION TRACKING
-- ============================================================================
-- Separate tracking for different storage locations
DROP TABLE IF EXISTS inventory_locations CASCADE;

CREATE TABLE inventory_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL, -- 'STORE', 'SHELVES', 'QUARANTINE', 'DISPOSAL'
  location_type TEXT CHECK (location_type IN ('storage', 'display', 'quarantine', 'disposal')),
  capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
  is_temperature_controlled BOOLEAN DEFAULT false,
  temperature_range TEXT, -- e.g., "2-8°C"
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (clinic_id, location_name)
);

CREATE INDEX idx_inventory_locations_clinic ON inventory_locations(clinic_id);
CREATE INDEX idx_inventory_locations_type ON inventory_locations(location_type);

-- ============================================================================
-- INVENTORY ADJUSTMENTS LOG
-- ============================================================================
-- Detailed record of inventory reconciliations and adjustments
DROP TABLE IF EXISTS inventory_adjustments CASCADE;

CREATE TABLE inventory_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  drug_id UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  expected_quantity INTEGER NOT NULL CHECK (expected_quantity >= 0),
  actual_quantity INTEGER NOT NULL CHECK (actual_quantity >= 0),
  difference INTEGER GENERATED ALWAYS AS (actual_quantity - expected_quantity) STORED,
  variance_percentage DECIMAL(5,2),
  reason TEXT CHECK (reason IN ('stock_count', 'breakage', 'expiry', 'theft', 'data_error', 'other')),
  recorded_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inventory_adjustments_clinic ON inventory_adjustments(clinic_id);
CREATE INDEX idx_inventory_adjustments_drug ON inventory_adjustments(drug_id);
CREATE INDEX idx_inventory_adjustments_created_at ON inventory_adjustments(created_at DESC);

-- ============================================================================
-- STOCK USAGE ANALYTICS
-- ============================================================================
-- Pre-calculated daily usage metrics for fast moving/slow moving analysis
DROP TABLE IF EXISTS daily_drug_usage CASCADE;

CREATE TABLE daily_drug_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  drug_id UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  quantity_sold INTEGER DEFAULT 0 CHECK (quantity_sold >= 0),
  quantity_prescribed INTEGER DEFAULT 0 CHECK (quantity_prescribed >= 0),
  revenue NUMERIC(12,2) DEFAULT 0 CHECK (revenue >= 0),
  cost NUMERIC(12,2) DEFAULT 0 CHECK (cost >= 0),
  profit NUMERIC(12,2) GENERATED ALWAYS AS (revenue - cost) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (clinic_id, drug_id, usage_date)
);

CREATE INDEX idx_daily_drug_usage_clinic ON daily_drug_usage(clinic_id);
CREATE INDEX idx_daily_drug_usage_drug ON daily_drug_usage(drug_id);
CREATE INDEX idx_daily_drug_usage_date ON daily_drug_usage(usage_date DESC);

-- ============================================================================
-- EXPIRY TRACKING
-- ============================================================================
-- Track drugs nearing expiry for proactive management
DROP TABLE IF EXISTS expiry_alerts CASCADE;

CREATE TABLE expiry_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  drug_id UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  alert_status TEXT DEFAULT 'active' CHECK (alert_status IN ('active', 'resolved', 'acknowledged')),
  acknowledged_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (clinic_id, drug_id, batch_number)
);

-- View to calculate days until expiry (calculate on-the-fly since CURRENT_DATE is not immutable)
CREATE OR REPLACE VIEW expiry_alerts_with_days_until AS
SELECT 
  *,
  (expiry_date - CURRENT_DATE)::INTEGER AS days_until_expiry
FROM expiry_alerts;

CREATE INDEX idx_expiry_alerts_clinic ON expiry_alerts(clinic_id);
CREATE INDEX idx_expiry_alerts_expiry_date ON expiry_alerts(expiry_date);
CREATE INDEX idx_expiry_alerts_alert_status ON expiry_alerts(alert_status);

-- ============================================================================
-- REORDER SUGGESTIONS
-- ============================================================================
-- Intelligent stock reorder recommendations based on usage patterns
DROP TABLE IF EXISTS reorder_suggestions CASCADE;

CREATE TABLE reorder_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  drug_id UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  current_stock INTEGER NOT NULL CHECK (current_stock >= 0),
  average_daily_usage DECIMAL(10,2) CHECK (average_daily_usage IS NULL OR average_daily_usage >= 0),
  recommended_quantity INTEGER CHECK (recommended_quantity IS NULL OR recommended_quantity > 0),
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  estimated_cost NUMERIC(12,2) CHECK (estimated_cost IS NULL OR estimated_cost >= 0),
  reason TEXT,
  suggested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ordered_at TIMESTAMP WITH TIME ZONE,
  order_quantity INTEGER,
  status TEXT DEFAULT 'suggested' CHECK (status IN ('suggested', 'ordered', 'received', 'cancelled')),
  notes TEXT,
  UNIQUE (clinic_id, drug_id, suggested_at)
);

CREATE INDEX idx_reorder_suggestions_clinic ON reorder_suggestions(clinic_id);
CREATE INDEX idx_reorder_suggestions_drug ON reorder_suggestions(drug_id);
CREATE INDEX idx_reorder_suggestions_urgency ON reorder_suggestions(urgency);
CREATE INDEX idx_reorder_suggestions_status ON reorder_suggestions(status);

-- ============================================================================
-- STOCK RECONCILIATION REPORTS
-- ============================================================================
-- Track stock count/inventory reconciliation sessions
DROP TABLE IF EXISTS stock_reconciliation_sessions CASCADE;

CREATE TABLE stock_reconciliation_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  location TEXT,
  initiated_by UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  completed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  total_items_counted INTEGER,
  total_discrepancies INTEGER DEFAULT 0,
  total_discrepancy_value NUMERIC(12,2),
  notes TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stock_reconciliation_clinic ON stock_reconciliation_sessions(clinic_id);
CREATE INDEX idx_stock_reconciliation_status ON stock_reconciliation_sessions(status);
CREATE INDEX idx_stock_reconciliation_date ON stock_reconciliation_sessions(session_date DESC);

-- ============================================================================
-- SUPPLY CHAIN TRACKING
-- ============================================================================
-- Track drug orders and suppliers for procurement management
DROP TABLE IF EXISTS drug_suppliers CASCADE;

CREATE TABLE drug_suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address JSONB,
  payment_terms TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (clinic_id, supplier_name)
);

CREATE INDEX idx_drug_suppliers_clinic ON drug_suppliers(clinic_id);
CREATE INDEX idx_drug_suppliers_status ON drug_suppliers(status);

-- Drug Supplier Items (what each supplier sells)
DROP TABLE IF EXISTS drug_supplier_items CASCADE;

CREATE TABLE drug_supplier_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES drug_suppliers(id) ON DELETE CASCADE,
  drug_id UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  supplier_sku TEXT,
  supplier_price NUMERIC(10,2) CHECK (supplier_price >= 0),
  lead_time_days INTEGER CHECK (lead_time_days > 0),
  minimum_order_quantity INTEGER CHECK (minimum_order_quantity > 0),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (supplier_id, drug_id)
);

CREATE INDEX idx_drug_supplier_items_supplier ON drug_supplier_items(supplier_id);
CREATE INDEX idx_drug_supplier_items_drug ON drug_supplier_items(drug_id);

-- Drug Orders
DROP TABLE IF EXISTS drug_orders CASCADE;

CREATE TABLE drug_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES drug_suppliers(id) ON DELETE RESTRICT,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  total_amount NUMERIC(12,2) CHECK (total_amount >= 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  ordered_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  delivery_received_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_drug_orders_clinic ON drug_orders(clinic_id);
CREATE INDEX idx_drug_orders_supplier ON drug_orders(supplier_id);
CREATE INDEX idx_drug_orders_status ON drug_orders(status);
CREATE INDEX idx_drug_orders_order_date ON drug_orders(order_date DESC);

-- Drug Order Items
DROP TABLE IF EXISTS drug_order_items CASCADE;

CREATE TABLE drug_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES drug_orders(id) ON DELETE CASCADE,
  drug_id UUID NOT NULL REFERENCES drugs(id) ON DELETE RESTRICT,
  quantity_ordered INTEGER NOT NULL CHECK (quantity_ordered > 0),
  quantity_received INTEGER DEFAULT 0 CHECK (quantity_received >= 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'partially_received', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (subtotal = quantity_ordered * unit_price)
);

CREATE INDEX idx_drug_order_items_order ON drug_order_items(order_id);
CREATE INDEX idx_drug_order_items_drug ON drug_order_items(drug_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_drug_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE expiry_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reorder_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_reconciliation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_supplier_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_order_items ENABLE ROW LEVEL SECURITY;

-- Clinic members can view their own clinic's inventory data
CREATE POLICY "clinic_members_can_view_stock_movements"
  ON stock_movements FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid() AND clinic_id IS NOT NULL
    )
  );

CREATE POLICY "clinic_members_can_view_inventory_adjustments"
  ON inventory_adjustments FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid() AND clinic_id IS NOT NULL
    )
  );

CREATE POLICY "clinic_members_can_view_expiry_alerts"
  ON expiry_alerts FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid() AND clinic_id IS NOT NULL
    )
  );

CREATE POLICY "clinic_members_can_view_reorder_suggestions"
  ON reorder_suggestions FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid() AND clinic_id IS NOT NULL
    )
  );

CREATE POLICY "pharmacists_can_insert_stock_movements"
  ON stock_movements FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM profiles
      WHERE id = auth.uid() AND clinic_id IS NOT NULL
        AND role IN ('pharmacist', 'admin')
    )
  );

CREATE POLICY "clinic_members_can_view_drug_orders"
  ON drug_orders FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid() AND clinic_id IS NOT NULL
    )
  );
