const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabaseClient');

const allowedTables = new Set([
  'appointments',
  'audit_logs',
  'beds',
  'billing_items',
  'cashier_shifts',
  'clinics',
  'consultations',
  'drugs',
  'employee_performance',
  'employees',
  'invoice_line_items',
  'lab_test_templates',
  'labtests',
  'medications',
  'notifications',
  'patient_invoices',
  'patients',
  'payments',
  'permissions',
  'pharmacy_inventory',
  'pharmacy_sale_items',
  'pharmacy_sales',
  'sales',
  'expenses',
  'prescriptions',
  'profiles',
  'sms_logs',
  'sms_transactions',
  'user_roles',
  'vitals',
  'wallet_transactions',
  'wards',
]);

const tablesWithClinicId = new Set([
  'appointments',
  'audit_logs',
  'beds',
  'billing_items',
  'cashier_shifts',
  'consultations',
  'drugs',
  'employee_performance',
  'employees',
  'invoice_line_items',
  'lab_test_templates',
  'labtests',
  'medications',
  'notifications',
  'patient_invoices',
  'patients',
  'payments',
  'permissions',
  'pharmacy_inventory',
  'pharmacy_sale_items',
  'pharmacy_sales',
  'sales',
  'expenses',
  'prescriptions',
  'profiles',
  'sms_logs',
  'sms_transactions',
  'user_roles',
  'vitals',
  'wallet_transactions',
  'wards',
]);

function sanitizeToken(value) {
  if (!value || typeof value !== 'string') return null;
  const token = value.trim();
  if (!token || token === 'null' || token === 'undefined') return null;
  return token.replace(/\s+/g, '');
}

function getRequestToken(req) {
  const authHeader = req?.headers?.authorization;
  const headerToken = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '') : null;
  const alternateToken = sanitizeToken(req?.headers?.['x-access-token'] || req?.headers?.['x-token'] || null);
  return sanitizeToken(req?.body?.token || req?.query?.token || headerToken || alternateToken || null);
}

async function getClinicByToken(token) {
  if (!token) return null;
  const { data: clinic, error } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', token)
    .maybeSingle();

  if (error) {
    console.error('Supabase getClinicByToken error:', error);
    return null;
  }

  return clinic || null;
}

function validateTable(table) {
  return allowedTables.has(table);
}

function buildQuery(table, token, params = {}) {
  let query = supabase.from(table).select(params.select || '*');

  if (table === 'clinics') {
    if (token) {
      query = query.eq('id', token);
    }
  } else if (tablesWithClinicId.has(table) && token) {
    query = query.eq('clinic_id', token);
  }

  if (params.id) {
    query = query.eq('id', params.id);
  }

  if (params.filter && typeof params.filter === 'object') {
    Object.entries(params.filter).forEach(([key, value]) => {
      if (value === null) {
        query = query.is(key, null);
      } else {
        query = query.eq(key, value);
      }
    });
  }

  if (params.orderBy) {
    query = query.order(params.orderBy.column, { ascending: params.orderBy.ascending });
  }

  if (params.limit) {
    query = query.limit(params.limit);
  }

  if (params.offset) {
    query = query.offset(params.offset);
  }

  return query;
}

function parseQueryParams(req) {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
  const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
  const orderBy = req.query.orderBy
    ? { column: req.query.orderBy, ascending: req.query.order === 'desc' ? false : true }
    : undefined;

  const filter = req.query.filter ? JSON.parse(req.query.filter) : undefined;
  const select = req.query.select ? req.query.select : undefined;

  return { limit, offset, orderBy, filter, select };
}

async function requireAuth(req, res, next) {
  const token = getRequestToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: token required' });
  }

  const clinic = await getClinicByToken(token);
  if (!clinic) {
    return res.status(401).json({ success: false, message: 'Invalid session token' });
  }

  req.clinicToken = token;
  next();
}

router.use(requireAuth);

router.get('/:table', async (req, res) => {
  const table = req.params.table;
  if (!validateTable(table)) {
    return res.status(400).json({ success: false, message: 'Table not allowed.' });
  }

  try {
    const params = parseQueryParams(req);
    const query = buildQuery(table, req.clinicToken, params);
    const { data, error } = await query;

    if (error) {
      console.error('Generic list error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Generic list exception:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:table/:id', async (req, res) => {
  const table = req.params.table;
  const id = req.params.id;
  if (!validateTable(table)) {
    return res.status(400).json({ success: false, message: 'Table not allowed.' });
  }

  try {
    const query = buildQuery(table, req.clinicToken, { id });
    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('Generic get error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({ success: true, data: data || null });
  } catch (error) {
    console.error('Generic get exception:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:table', async (req, res) => {
  const table = req.params.table;
  if (!validateTable(table)) {
    return res.status(400).json({ success: false, message: 'Table not allowed.' });
  }

  try {
    const row = { ...req.body };
    if (tablesWithClinicId.has(table) && !row.clinic_id) {
      row.clinic_id = req.clinicToken;
    }
    if (table === 'clinics') {
      row.id = req.clinicToken;
    }

    const { data, error } = await supabase.from(table).insert([row]);

    if (error) {
      console.error('Generic insert error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({ success: true, data: data?.[0] || null });
  } catch (error) {
    console.error('Generic insert exception:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:table/:id', async (req, res) => {
  const table = req.params.table;
  const id = req.params.id;
  if (!validateTable(table)) {
    return res.status(400).json({ success: false, message: 'Table not allowed.' });
  }

  try {
    let query = supabase.from(table).update(req.body).eq('id', id);
    if (table === 'clinics') {
      query = query.eq('id', req.clinicToken);
    } else if (tablesWithClinicId.has(table)) {
      query = query.eq('clinic_id', req.clinicToken);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Generic update error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({ success: true, data: data?.[0] || null });
  } catch (error) {
    console.error('Generic update exception:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:table/:id', async (req, res) => {
  const table = req.params.table;
  const id = req.params.id;
  if (!validateTable(table)) {
    return res.status(400).json({ success: false, message: 'Table not allowed.' });
  }

  try {
    let query = supabase.from(table).delete().eq('id', id);
    if (table === 'clinics') {
      query = query.eq('id', req.clinicToken);
    } else if (tablesWithClinicId.has(table)) {
      query = query.eq('clinic_id', req.clinicToken);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Generic delete error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Generic delete exception:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
