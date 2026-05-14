const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const router = express.Router();
const { sendGeniusSMS } = require('../lib/smsService');

const RSA_PRIVATE_KEY = process.env.RSA_PRIVATE_KEY || process.env.PRIVATE_KEY || null;
const RSA_PRIVATE_KEY_PEM = RSA_PRIVATE_KEY ? RSA_PRIVATE_KEY.replace(/\\n/g, '\n') : null;

const DEFAULT_ADMIN_EMAIL = 'agabafelix90@gmail.com';
const DEFAULT_ADMIN_PASSWORD = '12345';
const DEFAULT_INITIAL_WALLET_AMOUNT = 10000;

let supabaseClient = null;

const getSupabase = () => {
  if (!supabaseClient) {
    // Ensure environment variables are loaded
    require('dotenv').config();
    const { supabase } = require('../lib/supabaseClient');
    supabaseClient = supabase;
  }
  return supabaseClient;
};

function isMissingTableError(error) {
  if (!error) return false;
  return (
    error.code === 'PGRST205' ||
    (typeof error.message === 'string' && error.message.includes("Could not find the table 'public.employees'"))
  );
}

function isMissingColumnError(error) {
  if (!error || !error.message) return false;
  return /column .* of relation .* does not exist/i.test(error.message) ||
    /Could not find the ['"]?([^'"]+)['"]? column/i.test(error.message);
}

async function updateClinicWithRetry(token, payload) {
  const supabase = getSupabase();
  let updatePayload = { ...payload };

  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await supabase.from('clinics').update(updatePayload).eq('id', token);
    if (!error) {
      return { error: null };
    }

    if (!error.message) {
      return { error };
    }

    const match = error.message.match(/(?:column "?([^"\s]+)"? of relation .* does not exist)|(?:Could not find the ['"]?([^'"]+)['"]? column)/i);
    const missingColumn = match && (match[1] || match[2]);
    if (!missingColumn || !(missingColumn in updatePayload)) {
      return { error };
    }

    delete updatePayload[missingColumn];
  }

  const { error } = await supabase.from('clinics').update(updatePayload).eq('id', token);
  return { error };
}

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
  const supabase = getSupabase();
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

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function countClinicSetupItems(token) {
  const supabase = getSupabase();
  const tables = ['drugs', 'procedures', 'lab_tests', 'services'];
  let totalCount = 0;

  for (const table of tables) {
    try {
      const { count = 0, error } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', token);

      if (!error) {
        totalCount += Number(count) || 0;
      }
    } catch (error) {
      // ignore missing tables or unsupported tables during startup checks
      if (!isMissingTableError(error)) {
        console.error(`countClinicSetupItems table ${table} error:`, error);
      }
    }
  }

  return totalCount;
}

async function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;
  if (storedHash.startsWith('$2')) {
    return bcrypt.compare(password, storedHash);
  }
  return password === storedHash;
}

function getStoredPasswordHash(record) {
  if (!record) return null;
  if (record.password) {
    return record.password;
  }
  if (record.owners_info && typeof record.owners_info === 'object') {
    return record.owners_info.auth?.password_hash || null;
  }
  return null;
}

function isClinicAdminPasswordChanged(clinic) {
  if (!clinic) return false;
  if (clinic.admin_password_changed === true) return true;

  const storedHash = getStoredPasswordHash(clinic);
  if (!storedHash) return false;

  if (storedHash.startsWith('$2')) {
    return !bcrypt.compareSync(DEFAULT_ADMIN_PASSWORD, storedHash);
  }

  return storedHash !== DEFAULT_ADMIN_PASSWORD;
}

async function selectClinicWithOptionalAdminFlag(supabase, token) {
  const baseFields = 'name, set_up, subscription_balance, welcome_shown, is_first_login, wallet_balance, wallet_currency';
  let { data: clinic, error } = await supabase
    .from('clinics')
    .select(`${baseFields}, admin_password_changed, password, owners_info`)
    .eq('id', token)
    .maybeSingle();

  if (error && error.message && error.message.includes('admin_password_changed')) {
    const fallback = await supabase
      .from('clinics')
      .select(`${baseFields}, password, owners_info`)
      .eq('id', token)
      .maybeSingle();
    clinic = fallback.data;
    error = fallback.error;
  }

  if (error && isMissingColumnError(error)) {
    const fallback = await supabase
      .from('clinics')
      .select('name, set_up, welcome_shown, is_first_login, admin_password_changed, password, owners_info')
      .eq('id', token)
      .maybeSingle();
    clinic = fallback.data;
    error = fallback.error;
  }

  if (clinic) {
    clinic.admin_password_changed = isClinicAdminPasswordChanged(clinic);
  }

  return { data: clinic, error };
}

function isDefaultLoginAllowed(clinic, password) {
  if (!clinic) return false;
  const usingGlobalDefault = clinic.email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD;
  const usingClinicDefault = password === DEFAULT_ADMIN_PASSWORD;
  return (usingGlobalDefault || usingClinicDefault) && clinic.is_first_login === true;
}

function decryptMaybe(value) {
  if (!RSA_PRIVATE_KEY_PEM || typeof value !== 'string' || !value.trim()) {
    return value;
  }

  const trimmedValue = value.trim();
  if (!/[+/=]/.test(trimmedValue) || trimmedValue.length < 64) {
    return value;
  }

  try {
    const encryptedBuffer = Buffer.from(trimmedValue, 'base64');
    if (!encryptedBuffer.length) {
      return value;
    }

    const decrypted = crypto.privateDecrypt(
      {
        key: RSA_PRIVATE_KEY_PEM,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      encryptedBuffer,
    );

    const decryptedText = decrypted.toString('utf8');
    return decryptedText || value;
  } catch (err) {
    return value;
  }
}

function normalizeBillingBalance(clinic) {
  const subscriptionBalance = clinic.subscription_balance != null ? Number(clinic.subscription_balance) : null;
  const walletBalance = clinic.wallet_balance != null ? Number(clinic.wallet_balance) : null;
  const billingBalance = subscriptionBalance != null ? subscriptionBalance : walletBalance != null ? walletBalance : 0;
  const syncWallet = walletBalance != null && (subscriptionBalance == null || walletBalance === subscriptionBalance);
  return { subscriptionBalance, walletBalance, billingBalance, syncWallet };
}

function getSmsCost(smsType, message) {
  const text = String(message || '');
  const length = text.length;
  if (length === 0) return 0;

  let costPerChar = 0.9;
  let minCost = 150;

  switch (smsType) {
    case 'billing':
    case 'debt_reminder':
      costPerChar = 0.5;
      minCost = 100;
      break;
    case 'birthday':
      costPerChar = 0.6;
      minCost = 100;
      break;
    case 'custom':
    case 'notification':
    default:
      costPerChar = 0.9;
      minCost = 150;
      break;
  }

  return Number(Math.max(minCost, length * costPerChar).toFixed(2));
}

async function recordSmsCharge(supabase, clinic, cost, smsType, recipientPhone, message) {
  const { subscriptionBalance: currentSubscriptionBalance, walletBalance: currentWalletBalance } = normalizeBillingBalance(clinic);

  if (currentSubscriptionBalance < cost || currentWalletBalance < cost) {
    return { success: false, message: 'Insufficient subscription balance to send SMS' };
  }

  const newSubscriptionBalance = Number((currentSubscriptionBalance - cost).toFixed(2));
  const newWalletBalance = Number((currentWalletBalance - cost).toFixed(2));

  const updatePayload = {
    subscription_balance: newSubscriptionBalance,
    wallet_balance: newWalletBalance,
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await updateClinicWithRetry(clinic.id, updatePayload);
  if (updateError) {
    console.error('Supabase sms charge update error:', updateError);
    return { success: false, message: 'Failed to update subscription balance after SMS send' };
  }

  const walletTx = {
    clinic_id: clinic.id,
    transaction_type: 'debit',
    amount: cost,
    currency: 'UGX',
    description: `SMS charge (${smsType})`,
    balance_before: currentSubscriptionBalance,
    balance_after: newSubscriptionBalance,
    created_at: new Date().toISOString(),
  };

  const { error: walletError } = await supabase.from('wallet_transactions').insert([walletTx]);
  if (walletError) {
    console.error('Supabase wallet transaction insert error:', walletError);
    await updateClinicWithRetry(clinic.id, {
      subscription_balance: currentSubscriptionBalance,
      wallet_balance: currentWalletBalance,
      updated_at: new Date().toISOString(),
    });
    return { success: false, message: 'Failed to record SMS billing transaction' };
  }

  const smsTx = {
    clinic_id: clinic.id,
    transaction_type: 'usage',
    credits_amount: -1,
    cost,
    description: `SMS usage charge (${smsType})`,
    balance_before: clinic.sms_credits != null ? Number(clinic.sms_credits) : null,
    balance_after: clinic.sms_credits != null ? Number(clinic.sms_credits) - 1 : null,
    created_at: new Date().toISOString(),
  };

  const { error: smsTxError } = await supabase.from('sms_transactions').insert([smsTx]);
  if (smsTxError) {
    console.error('Supabase sms transaction insert error:', smsTxError);
    await updateClinicWithRetry(clinic.id, {
      subscription_balance: currentSubscriptionBalance,
      wallet_balance: currentWalletBalance,
      updated_at: new Date().toISOString(),
    });

    await supabase.from('wallet_transactions').insert([{
      clinic_id: clinic.id,
      transaction_type: 'credit',
      amount: cost,
      currency: 'UGX',
      description: `Refund SMS billing charge (${smsType})`,
      balance_before: newSubscriptionBalance,
      balance_after: currentSubscriptionBalance,
      created_at: new Date().toISOString(),
    }]);

    return { success: false, message: 'Failed to record SMS usage transaction' };
  }

  const logEntry = {
    clinic_id: clinic.id,
    recipient_phone: recipientPhone || '',
    message: message || '',
    sms_type: ['billing', 'birthday', 'debt_reminder', 'custom', 'notification'].includes(smsType) ? smsType : 'custom',
    status: 'sent',
    sent_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const { error: smsLogError } = await supabase.from('sms_logs').insert([logEntry]);
  if (smsLogError) {
    console.error('Supabase sms log insert error:', smsLogError);
  }

  return { success: true };
}

async function ensureInitialWalletSetup(clinic) {
  if (!clinic || clinic.wallet_preload_done) {
    return;
  }

  const balance = Number(clinic.wallet_balance || clinic.subscription_balance || DEFAULT_INITIAL_WALLET_AMOUNT);
  const updates = {
    subscription_balance: balance,
    wallet_balance: balance,
    wallet_currency: 'UGX',
    wallet_status: 'active',
    wallet_preload_done: true,
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await updateClinicWithRetry(clinic.id, updates);

  if (updateError) {
    console.error('Supabase wallet preload update error:', updateError);
  }

  const { error: txError } = await getSupabase().from('wallet_transactions').insert([
    {
      clinic_id: clinic.id,
      amount: balance,
      currency: 'UGX',
      transaction_type: 'credit',
      description: 'Welcome subscription preload',
    },
  ]);

  if (txError) {
    if (!isMissingTableError(txError)) {
      console.error('Supabase wallet transaction insert error:', txError);
    }
  }
}

async function addEmployee(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);
  const employeeName = req.body.employeeName || req.body.name;
  const employeeRole = req.body.employeeRole || req.body.role;
  const employeePassword = req.body.employeePassword || req.body.password;
  const loginCode = req.body.loginCode || req.body.logincode;

  if (!token) {
    return { success: false, message: 'Unauthorized' };
  }

  if (!employeeName || !employeeRole || !employeePassword) {
    return { success: false, message: 'Employee name, role, and password are required' };
  }

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return { success: false, message: 'Session expired' };
  }

  const login_code = loginCode || Math.random().toString(36).slice(-8);

  const insertPayload = {
    clinic_id: token,
    name: employeeName,
    role: employeeRole,
  };

  // Add optional columns that might exist in the schema
  const optionalColumns = {
    password: await hashPassword(employeePassword),
    login_code,
  };

  Object.assign(insertPayload, optionalColumns);

  const removeMissingColumns = async (payload) => {
    for (let attempt = 0; attempt < 10; attempt++) {
      const { data: insertData, error: insertError } = await supabase.from('employees').insert([payload]);
      if (!insertError) {
        return { data: insertData, error: null };
      }

      if (!insertError.message) {
        return { data: null, error: insertError };
      }

      const match = insertError.message.match(/Could not find the ['"]?([^'"]+)['"]? column/i);
      if (!match) {
        return { data: null, error: insertError };
      }

      const missingColumn = match[1];
      if (!(missingColumn in payload)) {
        return { data: null, error: insertError };
      }

      console.log(`[ADD EMPLOYEE] Removing missing column: ${missingColumn}`);
      delete payload[missingColumn];
    }

    return await supabase.from('employees').insert([payload]);
  };

  const { data, error } = await removeMissingColumns(insertPayload);

  if (error) {
    console.error('Supabase addEmployee error:', error);
    return {
      success: false,
      message: error.message || 'Failed to add employee',
      error,
    };
  }

  return {
    success: true,
    message: 'Employee added successfully',
    employee: data?.[0] || null,
  };
}


async function addSale(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);

  if (!token) {
    return { success: false, message: 'Unauthorized' };
  }

  const clinic = await getClinicByToken(token);
  if (!clinic) {
    return { success: false, message: 'Session expired' };
  }

  const payload = { ...req.body, clinic_id: token };
  const { data, error } = await supabase.from('sales').insert([payload]);

  if (error) {
    console.error('Supabase addSale error:', error);
    return { success: false, message: error.message || 'Failed to add sale' };
  }

  return { success: true, data };
}

async function fetchDrugs(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);

  if (!token) {
    return [];
  }

  const clinic = await getClinicByToken(token);
  if (!clinic) {
    return [];
  }

  const { data, error } = await supabase.from('drugs').select('*').eq('clinic_id', token);
  if (error) {
    console.error('Supabase fetchDrugs error:', error);
    throw error;
  }
  return (data || []).map(normalizeDrugRow);
}

async function fetchOriginalDrugs(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);

  if (!token) {
    return [];
  }

  const clinic = await getClinicByToken(token);
  if (!clinic) {
    return [];
  }

  const { data, error } = await supabase.from('drugs').select('*').eq('clinic_id', token);
  if (error) {
    console.error('Supabase fetchOriginalDrugs error:', error);
    throw error;
  }
  return (data || []).map(normalizeDrugRow);
}

async function addDrug(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);
  const { drugName, packaging, warningPoint, costPrice, sellingPrice } = req.body;

  if (!token || !drugName || !packaging) {
    return { success: false, message: 'Missing required drug information' };
  }

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return { success: false, message: 'Session expired' };
  }

  const { data, error } = await supabase
    .from('drugs')
    .insert([{
      clinic_id: token,
      drug_name: drugName,
      packaging,
      warning_point: Number(warningPoint) || 0,
      cost_price: Number(costPrice) || 0,
      selling_price: Number(sellingPrice) || 0,
      quantity: 0,
      average: 0,
      status: 'active',
      additional_info: '',
      unit_packaging: packaging,
      created_at: new Date().toISOString(),
    }])
    .select('*')
    .single();

  if (error) {
    console.error('Supabase addDrug error:', error);
    return { success: false, message: error.message || 'Failed to add drug' };
  }

  return { success: true, drug: data };
}

function normalizeDrugRow(drug) {
  if (!drug) return null;
  return {
    ...drug,
    drug_id: drug.id || drug.drug_id,
    drug_name: drug.drug_name || drug.name || '',
    packaging: drug.packaging || drug.unit_packaging || drug.description || '',
    warning_point: drug.warning_point || drug.warningPoint || 0,
    cost_price: drug.cost_price || drug.costPrice || drug.price || 0,
    selling_price: drug.selling_price || drug.sellingPrice || drug.price || 0,
    additional_info: drug.additional_info || drug.description || '',
    quantity: drug.quantity || 0,
  };
}

async function findDrugRecord(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);
  const drugId = req.body.drugId || req.body.drug_id;
  const drugName = req.body.drugName || req.body.drug_name;

  if (!token) {
    return { error: 'Unauthorized' };
  }

  let query = supabase.from('drugs').select('*').eq('clinic_id', token);

  if (drugId) {
    query = query.eq('id', drugId);
  } else if (drugName) {
    query = query.or(`drug_name.eq.${drugName},name.eq.${drugName}`);
  } else {
    return { error: 'Drug identifier missing' };
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    return { error };
  }

  if (!data) {
    return { notFound: true };
  }

  return { data };
}

async function updatedDrugDetails(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);
  const { drugId, oldDetails = {}, newDetails = {} } = req.body;

  if (!token) {
    return { success: false, message: 'Unauthorized' };
  }

  const drugRecord = await findDrugRecord(req);
  if (drugRecord.error) {
    return { success: false, message: drugRecord.error.message || drugRecord.error };
  }
  if (drugRecord.notFound) {
    return { success: false, message: 'Drug not found' };
  }

  const updatePayload = {
    drug_name: newDetails.drugName || oldDetails.drugName,
    packaging: newDetails.packaging || oldDetails.packaging,
    warning_point: Number(newDetails.warningPoint || oldDetails.warningPoint || 0),
    cost_price: Number(newDetails.costPrice || oldDetails.costPrice || 0),
    selling_price: Number(newDetails.sellingPrice || oldDetails.sellingPrice || 0),
    additional_info: newDetails.additionalInfo || drugRecord.data.additional_info || '',
    unit_packaging: newDetails.packaging || oldDetails.packaging,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('drugs')
    .update(updatePayload)
    .eq('id', drugRecord.data.id);

  if (error) {
    console.error('Supabase updatedDrugDetails error:', error);
    return { success: false, message: error.message || 'Failed to update drug details' };
  }

  return { success: true, message: 'Drug details updated successfully' };
}

async function fetchDrugQuantity(req) {
  const drugRecord = await findDrugRecord(req);
  if (drugRecord.error) {
    return { success: false, message: drugRecord.error.message || drugRecord.error };
  }
  if (drugRecord.notFound) {
    return { success: false, message: 'Drug not found' };
  }

  const drug = normalizeDrugRow(drugRecord.data);
  const quantity = Number(drug.quantity || 0);
  const useBatchNumbers = req.body.useBatchNumbers === true || req.body.batchNumbersEnabled === true;
  const useExpiryDate = req.body.useExpiryDate === true || req.body.expiryDateEnabled === true;

  if (useBatchNumbers || useExpiryDate) {
    return {
      success: true,
      dispensaryStock: [{ quantity, batch_number: '', expiry_date: '' }],
      storeStock: [],
    };
  }

  return {
    success: true,
    dispensaryStock: quantity,
    storeStock: 0,
  };
}

async function getPrescriptionDetails(req) {
  const drugRecord = await findDrugRecord(req);
  if (drugRecord.error) {
    return { success: false, message: drugRecord.error.message || drugRecord.error };
  }
  if (drugRecord.notFound) {
    return { success: false, message: 'Drug not found' };
  }

  const drug = normalizeDrugRow(drugRecord.data);
  const unit = drug.packaging || 'unit(s)';

  return {
    success: true,
    additionalInfo: drug.additional_info || '',
    unitDetails: [
      {
        prescriptionUnit: unit,
        unitsPerPackaging: 1,
      },
    ],
    prescription_unit: unit,
    units_per_packaging: 1,
  };
}

async function setPrescriptionDetails(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);
  const { drugId, units = [], additionalInfo = '' } = req.body;

  if (!token) {
    return { success: false, message: 'Unauthorized' };
  }

  const drugRecord = await findDrugRecord(req);
  if (drugRecord.error) {
    return { success: false, message: drugRecord.error.message || drugRecord.error };
  }
  if (drugRecord.notFound) {
    return { success: false, message: 'Drug not found' };
  }

  const updatePayload = {
    additional_info: additionalInfo,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('drugs')
    .update(updatePayload)
    .eq('id', drugRecord.data.id);

  if (error) {
    console.error('Supabase setPrescriptionDetails error:', error);
    return { success: false, message: error.message || 'Failed to update prescription details' };
  }

  return { success: true, message: 'Prescription settings updated successfully' };
}

async function updateStockFigures(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);
  const { dispensaryStock = 0, storeStock = 0, costPrice, sellingPrice } = req.body;

  if (!token) {
    return { success: false, message: 'Unauthorized' };
  }

  const drugRecord = await findDrugRecord(req);
  if (drugRecord.error) {
    return { success: false, message: drugRecord.error.message || drugRecord.error };
  }
  if (drugRecord.notFound) {
    return { success: false, message: 'Drug not found' };
  }

  const totalQuantity = Number(dispensaryStock || 0) + Number(storeStock || 0);
  const updatePayload = {
    quantity: totalQuantity,
    cost_price: Number(costPrice) || drugRecord.data.cost_price || drugRecord.data.costPrice || 0,
    selling_price: Number(sellingPrice) || drugRecord.data.selling_price || drugRecord.data.sellingPrice || 0,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('drugs')
    .update(updatePayload)
    .eq('id', drugRecord.data.id);

  if (error) {
    console.error('Supabase updateStockFigures error:', error);
    return { success: false, message: error.message || 'Failed to update stock figures' };
  }

  return { success: true, message: 'Stock figures updated successfully' };
}

async function updateStockFiguresBatch(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);
  const dispensaryStockItems = req.body.dispensaryStockItems || [];
  const storeStockItems = req.body.storeStockItems || [];
  const { costPrice, sellingPrice } = req.body;

  if (!token) {
    return { success: false, message: 'Unauthorized' };
  }

  const drugRecord = await findDrugRecord(req);
  if (drugRecord.error) {
    return { success: false, message: drugRecord.error.message || drugRecord.error };
  }
  if (drugRecord.notFound) {
    return { success: false, message: 'Drug not found' };
  }

  const dispensaryTotal = dispensaryStockItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );
  const storeTotal = storeStockItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );
  const totalQuantity = dispensaryTotal + storeTotal;

  const updatePayload = {
    quantity: totalQuantity,
    cost_price: Number(costPrice) || drugRecord.data.cost_price || drugRecord.data.costPrice || 0,
    selling_price: Number(sellingPrice) || drugRecord.data.selling_price || drugRecord.data.sellingPrice || 0,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('drugs')
    .update(updatePayload)
    .eq('id', drugRecord.data.id);

  if (error) {
    console.error('Supabase updateStockFiguresBatch error:', error);
    return { success: false, message: error.message || 'Failed to update batch stock figures' };
  }

  return { success: true, message: 'Batch stock figures updated successfully' };
}

async function fetchPrescriptionDrugs(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);
  if (!token) {
    return [];
  }

  const { data, error } = await supabase
    .from('drugs')
    .select('*')
    .eq('clinic_id', token);

  if (error) {
    console.error('Supabase fetchPrescriptionDrugs error:', error);
    return [];
  }

  return (data || []).map(normalizeDrugRow);
}

async function deleteOriginalDrug(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);
  const { drug_id, drugName, packaging } = req.body;

  if (!token || (!drug_id && (!drugName || !packaging))) {
    return { success: false, message: 'Missing required drug identification' };
  }

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return { success: false, message: 'Session expired' };
  }

  let query = supabase.from('drugs').delete().eq('clinic_id', token);

  if (drug_id) {
    query = query.eq('id', drug_id);
  } else {
    query = query.eq('drug_name', drugName).eq('packaging', packaging);
  }

  const { error } = await query;
  if (error) {
    console.error('Supabase deleteOriginalDrug error:', error);
    return { success: false, message: error.message || 'Failed to delete drug' };
  }

  return { success: true, message: 'Drug deleted successfully' };
}

async function stockWorth(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);

  if (!token) {
    return { success: false, message: 'Unauthorized', stockWorth: 0 };
  }

  const { data, error } = await supabase
    .from('drugs')
    .select('quantity, cost_price')
    .eq('clinic_id', token);

  if (error) {
    console.error('Supabase stockWorth error:', error);
    return { success: false, message: error.message || 'Failed to calculate stock worth', stockWorth: 0 };
  }

  const stockWorthValue = (data || []).reduce((total, drug) => {
    return total + (Number(drug.quantity) || 0) * (Number(drug.cost_price) || 0);
  }, 0);

  return { success: true, stockWorth: Math.round(stockWorthValue) };
}

async function createDrugOrder(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);
  const { days } = req.body;

  if (!token) {
    return [];
  }

  const { data, error } = await supabase
    .from('drugs')
    .select('*')
    .eq('clinic_id', token);

  if (error) {
    console.error('Supabase createDrugOrder error:', error);
    return [];
  }

  const suggestions = (data || []).map((drug) => {
    const quantity = Number(drug.quantity) || 0;
    const warningPoint = Number(drug.warning_point) || 0;
    const costPrice = Number(drug.cost_price) || 0;
    const quantityToBuy = Math.max(0, warningPoint - quantity);

    return {
      id: drug.id,
      drug_id: drug.id,
      name: drug.drug_name || drug.name || '',
      packaging: drug.packaging || drug.unit_packaging || '',
      quantityToBuy,
      costPrice,
      quantityLeftInStore: quantity,
      quantityLeftInDispensary: 0,
    };
  })
  .filter(drug => drug.quantityToBuy > 0)
  .sort((a, b) => b.quantityToBuy - a.quantityToBuy);

  return suggestions;
}

async function fetchContacts(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);
  if (!token) {
    return [];
  }

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('clinic_id', token);

  if (error) {
    console.error('Supabase fetchContacts error:', error);
    return [];
  }

  return data || [];
}

async function addContact(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);
  const {
    firstName,
    lastName,
    phoneNumber,
    years,
    months,
    weeks,
    sex,
    religion,
    dob,
    address,
    nextOfKinName,
    nextOfKinContact,
    nextOfKinRelationship,
  } = req.body;

  if (!token || !firstName || !lastName || !phoneNumber) {
    return { success: false, message: 'Missing required patient details' };
  }

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

  const { data, error } = await supabase
    .from('contacts')
    .insert([{ clinic_id: token, name: fullName, phone: phoneNumber }])
    .select('id, name, phone')
    .single();

  if (error || !data) {
    console.error('Supabase addContact error:', error);
    return { success: false, message: error?.message || 'Failed to add contact' };
  }

  const patientDetails = {
    first_name: firstName,
    last_name: lastName,
    contact_id: data.id,
    phone_number: data.phone,
    years: years || 0,
    months: months || 0,
    weeks: weeks || 0,
    sex: sex || '',
    religion: religion || '',
    dob: dob || '',
    address: address || '',
    nextOfKinName: nextOfKinName || '',
    nextOfKinContact: nextOfKinContact || '',
    nextOfKinRelationship: nextOfKinRelationship || '',
  };

  return {
    success: true,
    message: 'Patient added successfully',
    patientDetails,
  };
}

async function fetchAvailableTests(req, tableNames) {
  const supabase = getSupabase();
  const token = getRequestToken(req);
  if (!token) {
    return [];
  }

  for (const table of tableNames) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('clinic_id', token);

      if (error) {
        if (isMissingTableError(error)) {
          continue;
        }
        console.error(`Supabase ${table} error:`, error);
        continue;
      }

      if (Array.isArray(data) && data.length > 0) {
        return data.map(item => ({
          name: item.name || item.test_name || item.title || item.id,
          price: item.price || item.cost || item.fee || 0,
        }));
      }
    } catch (error) {
      if (!isMissingTableError(error)) {
        console.error(`Error fetching tests from ${table}:`, error);
      }
    }
  }

  return [];
}

async function fetchAvailableLabTests(req) {
  return fetchAvailableTests(req, ['lab_tests', 'procedures', 'services']);
}

async function fetchAvailableRadiologyTests(req) {
  return fetchAvailableTests(req, ['radiology_tests', 'procedures', 'services']);
}

async function submitWalkinPatient(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);
  const {
    contactId,
    bloodPressure,
    temperature,
    spo2,
    bodyWeight,
    height,
    respiratory_rate,
    pulse_rate,
    labTests = [],
    radiologyExams = [],
    action,
    familyPlanning,
    antenatalCare,
    attention,
    visitClassification,
    signsAndSymptoms,
    consultationFeeRequired,
    consultationFeeAmount,
  } = req.body;

  if (!token || !contactId || !attention || !visitClassification) {
    return { success: false, message: 'Missing required patient details' };
  }

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return { success: false, message: 'Session expired' };
  }

  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .eq('clinic_id', token)
    .maybeSingle();

  if (contactError || !contact) {
    return { success: false, message: 'Patient contact not found' };
  }

  const patientName = contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Patient';
  const appointmentId = `triage-${Date.now()}-${contactId.slice(0, 8)}`;

  const { error } = await supabase.from('appointments').insert([
    {
      appointment_id: appointmentId,
      patient_name: patientName,
      first_name: contact.first_name || null,
      last_name: contact.last_name || null,
      date: new Date().toISOString(),
      date_of_appointment: new Date().toISOString(),
      description: action || visitClassification || 'Triage entry',
      appointment_reason: familyPlanning
        ? 'Family Planning'
        : antenatalCare
        ? 'Antenatal Care'
        : action || visitClassification || 'Triage request',
      appointment_message: signsAndSymptoms || '',
      reminded: 'no',
      clinic_id: token,
    },
  ]);

  if (error) {
    console.error('Supabase submitWalkinPatient error:', error);
    return { success: false, message: error.message || 'Failed to insert patient data' };
  }

  return { success: true, message: 'Data inserted successfully' };
}

async function suggest(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);
  const name = req.query?.name || req.body?.name;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!token || !name || !uuidRegex.test(token)) {
    return [];
  }

  const queryName = `%${name.replace(/[%_]/g, '')}%`;
  let result = await supabase
    .from('contacts')
    .select('*')
    .or(
      `name.ilike.${queryName},first_name.ilike.${queryName},last_name.ilike.${queryName}`
    )
    .eq('clinic_id', token)
    .limit(10);

  if (result.error) {
    console.warn('Fallback suggest query due to missing columns or invalid search fields:', result.error.message);
    const fallbackResult = await supabase
      .from('contacts')
      .select('*')
      .eq('clinic_id', token)
      .limit(100);

    if (fallbackResult.error) {
      console.error('Supabase suggest fallback error:', fallbackResult.error);
      return { error: fallbackResult.error.message || 'Failed to fetch suggestions' };
    }

    const filterValue = name.toLowerCase();
    const filtered = (fallbackResult.data || []).filter(contact => {
      const fullName = `${contact.name || ''} ${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
      return fullName.includes(filterValue);
    }).slice(0, 10);

    return filtered;
  }

  const data = result.data;

  return data || [];
}

async function fetchAppointments(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);

  if (!token) {
    return { success: false, message: 'Unauthorized' };
  }

  // Verify clinic exists
  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return { success: false, message: 'Session expired' };
  }

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('clinic_id', token)
    .order('appointment_date', { ascending: true });

  if (error) {
    console.error('Supabase fetchAppointments error:', error);
    return { success: false, message: 'Failed to fetch appointments' };
  }

  // Transform data to match frontend expectations
  const transformedAppointments = (data || []).map(appointment => ({
    appointment_id: appointment.appointment_id || appointment.id,
    first_name: appointment.first_name || (appointment.patient_name ? appointment.patient_name.split(' ')[0] : ''),
    last_name: appointment.last_name || (appointment.patient_name ? appointment.patient_name.split(' ').slice(1).join(' ') : ''),
    patient_name: appointment.patient_name,
    date_of_appointment: appointment.date_of_appointment || appointment.date,
    appointment_reason: appointment.appointment_reason || appointment.description,
    appointment_message: appointment.appointment_message || appointment.description,
    reminded: appointment.reminded || 'no',
    clinic_id: appointment.clinic_id
  }));

  return { success: true, appointments: transformedAppointments };
}

async function registerClinic(req) {
  const supabase = getSupabase();
  const { confirmPassword, ...clinicData } = req.body;
  const clinicName = clinicData.name || clinicData.clinicName || clinicData.clinic_name;

  clinicData.password = decryptMaybe(clinicData.password);
  const decryptedConfirmPassword = decryptMaybe(confirmPassword);

  if (!clinicData.password || !clinicName) {
    return { success: false, message: 'Clinic name and password are required' };
  }

  if (decryptedConfirmPassword && clinicData.password !== decryptedConfirmPassword) {
    return { success: false, message: 'Password and confirm password do not match' };
  }

  const address = {
    district: clinicData.district || clinicData.region || null,
    town: clinicData.town || null,
    country: clinicData.country || null,
    street: clinicData.ownersAddress || null,
  };

  const hashedPassword = await hashPassword(clinicData.password);
  const ownersInfo = {
    names: clinicData.ownersNames
      ? clinicData.ownersNames.split(',').map((name) => name.trim()).filter(Boolean)
      : [],
    contacts: [clinicData.ownersContact, clinicData.ownersWhatsapp].filter(Boolean),
    auth: {
      password_hash: hashedPassword,
    },
  };

  const insertPayload = {
    name: clinicName,
    email: clinicData.email,
    address,
    owners_info: ownersInfo,
    year_established: clinicData.yearOfOpening ? parseInt(clinicData.yearOfOpening, 10) : null,
    status: 'active',
    set_up: 'clinic',
    subscription_balance: clinicData.subscription_balance ?? DEFAULT_INITIAL_WALLET_AMOUNT,
    wallet_balance: clinicData.subscription_balance ?? DEFAULT_INITIAL_WALLET_AMOUNT,
    wallet_currency: 'UGX',
    is_first_login: true,
    password: hashedPassword,
  };

  const optionalColumns = {
    wallet_status: 'active',
    wallet_preload_done: false,
    setup_completed: false,
    welcome_shown: false,
    admin_password_changed: false,
    enable_bill_payment_sms: false,
    enable_birthday_sms: false,
    enable_debt_reminder_sms: false,
    enable_appointment_reminder_sms: false,
  };

  // Try to add optional columns that might exist in the schema
  Object.assign(insertPayload, optionalColumns);

  const removeMissingColumns = async (payload) => {
    for (let attempt = 0; attempt < 10; attempt++) {
      const { data: insertData, error: insertError } = await supabase.from('clinics').insert([payload]);
      if (!insertError) {
        return { data: insertData, error: null };
      }

      if (!insertError.message) {
        return { data: null, error: insertError };
      }

      const match = insertError.message.match(/Could not find the ['"]?([^'"]+)['"]? column/i);
      if (!match) {
        return { data: null, error: insertError };
      }

      const missingColumn = match[1];
      if (!(missingColumn in payload)) {
        return { data: null, error: insertError };
      }

      console.log(`[REGISTER] Removing missing column: ${missingColumn}`);
      delete payload[missingColumn];
    }

    return await supabase.from('clinics').insert([payload]);
  };

  const { data, error } = await removeMissingColumns(insertPayload);
  if (error) {
    console.error('Supabase registration error:', error);
    return {
      success: false,
      message: error.code === '23505' ? 'Email already exists.' : (error.message || 'Registration failed.'),
      details: error.details || null,
    };
  }
  const clinic = data?.[0];
  return {
    success: true,
    clinic,
    sessionToken: clinic?.id,
    clinic_session_token: clinic?.id,
  };
}

async function loginClinic(req) {
  const supabase = getSupabase();
  const { clinicName } = req.body;
  const password = decryptMaybe(req.body.password);

  if (!clinicName || !password) {
    return { success: false, message: 'Clinic name and password are required' };
  }

  console.log(`[LOGIN] Attempting login with clinicName=${clinicName}`);

  // Try to find clinic by name first
  let clinic = null;
  const { data: clinicByName, error: nameError } = await supabase
    .from('clinics')
    .select('*')
    .eq('name', clinicName)
    .maybeSingle();

  if (nameError) {
    console.error('[LOGIN] Supabase name query error:', nameError);
    return { success: false, message: 'Login failed.' };
  }

  clinic = clinicByName;

  if (!clinic) {
    const { data: clinicByEmail, error: emailError } = await supabase
      .from('clinics')
      .select('*')
      .eq('email', clinicName)
      .maybeSingle();

    if (emailError) {
      console.error('[LOGIN] Supabase email query error:', emailError);
      return { success: false, message: 'Login failed.' };
    }

    clinic = clinicByEmail;
  }

  if (!clinic) {
    console.log('[LOGIN] No clinic found');
    return { success: false, message: 'Invalid credentials' };
  }

  const storedPasswordHash = getStoredPasswordHash(clinic);
  const passwordMatches = storedPasswordHash ? await verifyPassword(password, storedPasswordHash) : false;
  const passwordIsDefault = password === DEFAULT_ADMIN_PASSWORD;
  const defaultAllowed = isDefaultLoginAllowed(clinic, password);

  if (!passwordMatches && !(passwordIsDefault && defaultAllowed)) {
    console.log('[LOGIN] Password mismatch for clinic', clinic.email || clinic.name);
    return { success: false, message: 'Invalid credentials' };
  }

  if (passwordIsDefault && !defaultAllowed) {
    console.log('[LOGIN] Default admin password blocked after first login for', clinic.email || clinic.name);
    return { success: false, message: 'Invalid credentials' };
  }

  await ensureInitialWalletSetup(clinic);

  return {
    success: true,
    clinic,
    isFirstLogin: clinic.is_first_login === true,
    admin_password_changed: isClinicAdminPasswordChanged(clinic),
    sessionToken: clinic.id,
    clinic_session_token: clinic.id,
  };
}

async function fetchClinicName(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);

  if (!token) {
    return {
      success: false,
      message: 'Unauthorized',
      clinic_name: null,
      set_up: 'clinic',
      subscription_balance: 10000,
      welcome_shown: false,
    };
  }

  const { data: clinic, error } = await selectClinicWithOptionalAdminFlag(supabase, token);

  if (error || !clinic) {
    return {
      success: false,
      message: 'Session expired',
      clinic_name: null,
      set_up: 'clinic',
      subscription_balance: 10000,
      welcome_shown: false,
    };
  }

  const facilityConfigCount = await countClinicSetupItems(token);

  return {
    success: true,
    clinic_name: clinic.name,
    set_up: clinic.set_up || 'clinic',
    subscription_balance: Number(clinic.subscription_balance || 10000),
    wallet_balance: Number(clinic.wallet_balance || clinic.subscription_balance || 10000),
    wallet_currency: clinic.wallet_currency || 'UGX',
    welcome_shown: clinic.welcome_shown === true,
    isFirstLogin: clinic.is_first_login === true,
    admin_password_changed: isClinicAdminPasswordChanged(clinic),
    facilityConfigCount,
  };
}

async function markWelcomeShown(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);

  if (!token) {
    return { success: false, message: 'Unauthorized' };
  }

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return { success: false, message: 'Session expired' };
  }

  const { error: updateError } = await supabase
    .from('clinics')
    .update({ welcome_shown: true })
    .eq('id', token);

  if (updateError) {
    console.error('Supabase markWelcomeShown error:', updateError);
    return { success: false, message: 'Failed to update welcome status' };
  }

  return { success: true, message: 'Welcome modal marked as shown' };
}

async function finishOnboarding(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);

  if (!token) {
    return { success: false, message: 'Unauthorized' };
  }

  let { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id, is_first_login, admin_password_changed, password, owners_info')
    .eq('id', token)
    .maybeSingle();

  if (clinicError && clinicError.message && clinicError.message.includes('admin_password_changed')) {
    const fallback = await supabase
      .from('clinics')
      .select('id, is_first_login, password, owners_info')
      .eq('id', token)
      .maybeSingle();
    clinic = fallback.data;
    clinicError = fallback.error;
  }

  if (clinicError || !clinic) {
    return { success: false, message: 'Session expired' };
  }

  const isAdminPasswordChanged = isClinicAdminPasswordChanged(clinic);
  if (!isAdminPasswordChanged) {
    return { success: false, message: 'Please change the default admin password before completing setup.' };
  }

  const [{ count: employeeCount = 0 } = {}, { count: drugCount = 0 } = {}] = await Promise.all([
    supabase.from('employees').select('id', { count: 'exact', head: true }).eq('clinic_id', token),
    supabase.from('drugs').select('id', { count: 'exact', head: true }).eq('clinic_id', token),
  ]);
  const facilityConfigCount = await countClinicSetupItems(token);

  if (Number(employeeCount) < 1) {
    return { success: false, message: 'Add at least one employee before you complete setup.' };
  }

  if (facilityConfigCount < 1) {
    return { success: false, message: 'Add at least one drug, procedure, or lab test before you complete setup.' };
  }

  const { error: updateError } = await supabase
    .from('clinics')
    .update({ is_first_login: false, welcome_shown: true, updated_at: new Date().toISOString() })
    .eq('id', token);

  if (updateError) {
    console.error('Supabase finishOnboarding error:', updateError);
    return { success: false, message: 'Failed to complete onboarding.' };
  }

  return { success: true, message: 'Onboarding completed successfully.' };
}

async function fetchAdminData(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);

  if (!token) {
    return {
      success: false,
      message: 'Unauthorized',
      employee_count: 0,
      active_patients_count: 0,
      inactive_patients_count: 0,
      lost_clients_count: 0,
      total_worth: 0,
      dispensary_worth: 0,
      stock_worth: 0,
      revenue: 0,
    };
  }

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return {
      success: false,
      message: 'Session expired',
      employee_count: 0,
      active_patients_count: 0,
      inactive_patients_count: 0,
      lost_clients_count: 0,
      total_worth: 0,
      dispensary_worth: 0,
      stock_worth: 0,
      revenue: 0,
    };
  }

  const [{ count: employeeCount = 0 } = {}, { data: drugRows = [] } = {}, { data: saleRows = [] } = {}, { data: appointmentRows = [] } = {}] = await Promise.all([
    supabase.from('employees').select('id', { count: 'exact', head: true }).eq('clinic_id', token),
    supabase.from('drugs').select('quantity, price').eq('clinic_id', token),
    supabase.from('sales').select('total_price').eq('clinic_id', token),
    supabase.from('appointments').select('patient_name').eq('clinic_id', token),
  ]);

  const totalWorth = (drugRows || []).reduce((sum, drug) => {
    const quantity = Number(drug.quantity) || 0;
    const price = Number(drug.price) || 0;
    return sum + quantity * price;
  }, 0);

  const revenue = (saleRows || []).reduce((sum, sale) => {
    const price = Number(sale.total_price) || 0;
    return sum + price;
  }, 0);

  const activePatientsCount = new Set(
    (appointmentRows || [])
      .map(a => a.patient_name?.toString().trim().toLowerCase())
      .filter(Boolean)
  ).size;

  return {
    success: true,
    employee_count: Number(employeeCount) || 0,
    active_patients_count: activePatientsCount,
    inactive_patients_count: 0,
    lost_clients_count: 0,
    total_worth: Math.round(totalWorth),
    dispensary_worth: Math.round(totalWorth),
    stock_worth: Math.round(totalWorth),
    revenue: Math.round(revenue),
  };
}

async function fetchPerformance() {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('performance').select('*');
  if (error) throw error;
  return { success: true, performance: data };
}

async function verifySecurity(req) {
  const supabase = getSupabase();
  const { token } = req.body;

  if (!token) {
    return {
      success: false,
      message: 'Session expired',
      error: 'Session expired',
      clinic_session_token: null,
    };
  }

  // Look up the clinic by ID (token is the clinic ID)
  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return {
      success: false,
      message: 'Session expired',
      error: 'Session expired',
      clinic_session_token: null,
    };
  }

  const [{ count: employeeCount = 0 } = {}, { count: drugCount = 0 } = {}] = await Promise.all([
    supabase.from('employees').select('id', { count: 'exact', head: true }).eq('clinic_id', token),
    supabase.from('drugs').select('id', { count: 'exact', head: true }).eq('clinic_id', token),
  ]);

  const facilityConfigCount = await countClinicSetupItems(clinic.id);

  return {
    success: true,
    message: 'Session valid',
    clinic_session_token: clinic.id,
    employee_name: 'Admin',
    clinic: clinic.name,
    district: 'Uganda',
    owners_contact: clinic.ownerscontact || clinic.owners_info?.contacts?.[0] || '',
    town: clinic.town || clinic.address?.town || clinic.address?.city || '',
    colour: 'white',
    set_up: clinic.set_up || 'clinic',
    has_header: false,
    use_drug_expiry_date: 'yes',
    use_drug_batch_numbers: 'yes',
    consultation_fee: 0,
    subscription_balance: Number(clinic.subscription_balance || 10000),
    wallet_balance: Number(clinic.wallet_balance || clinic.subscription_balance || 10000),
    wallet_currency: clinic.wallet_currency || 'UGX',
    welcome_shown: clinic.welcome_shown === true,
    isFirstLogin: clinic.is_first_login === true,
    admin_password_changed: isClinicAdminPasswordChanged(clinic),
    employee_count: Number(employeeCount) || 0,
    drug_count: Number(drugCount) || 0,
    facilityConfigCount,
    canFinishOnboarding: isClinicAdminPasswordChanged(clinic) && Number(employeeCount) > 0 && facilityConfigCount > 0,
  };
}

async function dashboardToken(req) {
  const { token } = req.body;
  if (!token) {
    return {
      success: false,
      message: 'Token required',
      token: null,
    };
  }

  const supabase = getSupabase();
  const { data: clinic, error } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', token)
    .maybeSingle();

  if (error || !clinic) {
    return {
      success: false,
      message: 'Invalid token',
      token: null,
    };
  }

  return {
    success: true,
    token: clinic.id,
  };
}

async function logout(req) {
  const token = getRequestToken(req);

  if (!token) {
    return {
      success: false,
      message: 'Token required',
    };
  }

  // Session is stateless for legacy compatibility; accept the logout and clear client state.
  return {
    success: true,
    message: 'Logged out successfully',
  };
}

async function fetchBalance(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);

  if (!token) {
    return {
      success: false,
      message: 'Unauthorized',
      current_balance: 10000,
      currency: 'UGX',
    };
  }

  const { data: clinic, error } = await supabase
    .from('clinics')
    .select('subscription_balance')
    .eq('id', token)
    .maybeSingle();

  if (error || !clinic) {
    console.error('Supabase fetchBalance error:', error);
    return {
      success: true,
      current_balance: 10000,
      currency: 'UGX',
    };
  }

  return {
    success: true,
    current_balance: Number(clinic.subscription_balance || 10000),
    currency: 'UGX',
  };
}

async function buildCreditSummary(patientBalances) {
  const departmentTotals = {
    family_planning: 0,
    consultation: 0,
    services: { balance: 0 },
    lab: 0,
    radiology: 0,
    rx_treatments: { balance: 0 },
    credits: 0,
  };

  patientBalances.forEach(patient => {
    const dt = patient.department_totals || {};
    departmentTotals.family_planning += Number(dt.family_planning || 0);
    departmentTotals.consultation += Number(dt.consultation || 0);
    departmentTotals.lab += Number(dt.lab || 0);
    departmentTotals.radiology += Number(dt.radiology || 0);
    departmentTotals.services.balance += Number((dt.services && dt.services.balance) || dt.services || 0);
    departmentTotals.rx_treatments.balance += Number((dt.rx_treatments && dt.rx_treatments.balance) || dt.rx_treatments || 0);
    departmentTotals.credits += Number(dt.credits || 0);
  });

  return {
    department_totals: departmentTotals,
    total_unpaid_balance: patientBalances.reduce((sum, patient) => sum + Number(patient.net_balance || 0), 0),
    net_unpaid_balance: patientBalances.reduce((sum, patient) => sum + Number(patient.net_balance || 0), 0),
  };
}

async function fetchCredits2(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);

  if (!token) {
    return {
      success: false,
      message: 'Unauthorized',
      patient_balances: [],
      summary: {
        department_totals: {
          family_planning: 0,
          consultation: 0,
          services: { balance: 0 },
          lab: 0,
          radiology: 0,
          rx_treatments: { balance: 0 },
          credits: 0,
        },
        total_unpaid_balance: 0,
        net_unpaid_balance: 0,
      },
    };
  }

  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('id, name, email, phone')
    .eq('clinic_id', token)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Supabase fetchCredits2 error:', error);
    return {
      success: true,
      patient_balances: [],
      summary: {
        department_totals: {
          family_planning: 0,
          consultation: 0,
          services: { balance: 0 },
          lab: 0,
          radiology: 0,
          rx_treatments: { balance: 0 },
          credits: 0,
        },
        total_unpaid_balance: 0,
        net_unpaid_balance: 0,
      },
    };
  }

  const patientBalances = (contacts || []).map(contact => {
    const nameParts = (contact.name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      contact_id: contact.id,
      id: contact.id,
      details: {
        contact_id: contact.id,
        first_name: firstName,
        last_name: lastName,
        phone_number: contact.phone || '',
        age: null,
        sex: null,
        religion: null,
        dob: null,
        age_months: 0,
        age_weeks: 0,
      },
      patient_name: contact.name,
      total_bill: 0,
      net_balance: 0,
      department_totals: {
        family_planning: 0,
        consultation: 0,
        services: { balance: 0 },
        lab: 0,
        radiology: 0,
        rx_treatments: { balance: 0 },
        credits: 0,
      },
      file_count: 0,
      file_ids: [],
    };
  });

  return {
    success: true,
    patient_balances: patientBalances,
    summary: await buildCreditSummary(patientBalances),
  };
}

async function fetchCredits3(req) {
  const creditsResponse = await fetchCredits2(req);
  return {
    success: creditsResponse.success,
    summary: creditsResponse.summary,
  };
}

async function fetchCredits(req) {
  return fetchCredits2(req);
}

async function confirmCredit(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);

  if (!token) {
    return { success: false, message: 'Unauthorized' };
  }

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return { success: false, message: 'Session expired' };
  }

  return { success: true, message: 'Credit confirmed successfully' };
}

async function submitPayment2(req) {
  const supabase = getSupabase();
  const { token, contactId, amount } = req.body;

  if (!token || !contactId || amount == null) {
    return { success: false, message: 'Missing required payment parameters' };
  }

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return { success: false, message: 'Session expired' };
  }

  const paymentAmount = Number(amount) || 0;

  return {
    status: 'success',
    message: 'Payment processed successfully',
    amount_received: paymentAmount,
    amount_used: paymentAmount,
    totalBill: paymentAmount,
    balance: 0,
    change: 0,
    shift_info: null,
    debts_paid: 0,
    consultation_paid: 0,
    lab_paid: 0,
    radiology_paid: 0,
    bills_paid: 0,
    services_paid: 0,
    fp_paid: 0,
    payment_details: [],
  };
}

async function clearUnconditionally(req) {
  const token = getRequestToken(req);

  if (!token) {
    return { success: false, message: 'Unauthorized' };
  }

  return { success: true, message: 'File cleared successfully' };
}

async function fetchEmployees2(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);

  if (!token) {
    return {
      success: false,
      message: 'Unauthorized',
      employees: [],
    };
  }

  // Verify clinic exists
  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return {
      success: false,
      message: 'Session expired',
      employees: [],
    };
  }

  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select('id, name, role, login_code')
    .eq('clinic_id', token)
    .order('created_at', { ascending: true });

  if (employeesError) {
    console.error('Supabase fetchEmployees2 error:', employeesError);
    if (isMissingTableError(employeesError)) {
      return {
        success: true,
        employees: [],
      };
    }
    return {
      success: false,
      message: 'Failed to fetch employees',
      employees: [],
    };
  }

  // Map database field names to frontend field names
  const mappedEmployees = (employees || []).map(emp => ({
    EmployeeID: emp.id,
    Name: emp.name,
    Role: emp.role,
    LoginCode: emp.login_code
  }));

  return mappedEmployees;
}

async function fetchEmployees(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);

  if (!token) {
    return {
      success: false,
      message: 'Unauthorized',
      data: [],
    };
  }

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return {
      success: false,
      message: 'Session expired',
      data: [],
    };
  }

  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select('id, name, role, login_code')
    .eq('clinic_id', token)
    .order('created_at', { ascending: true });

  if (employeesError) {
    console.error('Supabase fetchEmployees error:', employeesError);
    if (isMissingTableError(employeesError)) {
      return {
        success: true,
        data: [],
      };
    }
    return {
      success: false,
      message: 'Failed to fetch employees',
      data: [],
    };
  }

  // Map database field names to frontend field names
  const mappedEmployees = (employees || []).map(emp => ({
    EmployeeID: emp.id,
    Name: emp.name,
    Role: emp.role,
    LoginCode: emp.login_code
  }));

  return {
    success: true,
    data: mappedEmployees,
  };
}

async function fetchPermissions(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);

  if (!token) {
    return {
      success: false,
      message: 'Unauthorized',
      permissions: [],
    };
  }

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return {
      success: false,
      message: 'Session expired',
      permissions: [],
    };
  }

  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select('id')
    .eq('clinic_id', token);

  if (employeesError) {
    console.error('Supabase fetchPermissions employee lookup error:', employeesError);
    return {
      success: false,
      message: 'Failed to fetch permissions',
      permissions: [],
    };
  }

  const employeeIds = (employees || []).map(emp => emp.id).filter(Boolean);
  if (employeeIds.length === 0) {
    return {
      success: true,
      permissions: [
        'view_dashboard',
        'view_sales',
        'view_inventory',
        'manage_employees',
      ],
    };
  }

  const { data: permissions, error: permissionsError } = await supabase
    .from('permissions')
    .select('permission')
    .in('employee_id', employeeIds);

  if (permissionsError) {
    if (isMissingTableError(permissionsError)) {
      return {
        success: true,
        permissions: [
          'view_dashboard',
          'view_sales',
          'view_inventory',
          'manage_employees',
        ],
      };
    }
    console.error('Supabase fetchPermissions error:', permissionsError);
    return {
      success: false,
      message: 'Failed to fetch permissions',
      permissions: [],
    };
  }

  return {
    success: true,
    permissions: Array.from(new Set((permissions || []).map(p => p.permission).filter(Boolean))),
  };
}

async function fetchPermissions2(req) {
  const supabase = getSupabase();
  const { employeeName, token } = req.body;

  if (!token || !employeeName) {
    return {
      success: false,
      message: 'Unauthorized or missing employee name',
      permissions: [],
    };
  }

  // Verify clinic exists
  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return {
      success: false,
      message: 'Session expired',
      permissions: [],
    };
  }

  // Find employee
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id')
    .eq('clinic_id', token)
    .ilike('name', employeeName)
    .maybeSingle();

  if (employeeError || !employee) {
    return {
      success: false,
      message: 'Employee not found',
      permissions: [],
    };
  }

  // Get permissions
  const { data: permissions, error: permissionsError } = await supabase
    .from('permissions')
    .select('permission')
    .eq('employee_id', employee.id);

  if (permissionsError) {
    if (isMissingTableError(permissionsError)) {
      return {
        success: true,
        permissions: [],
      };
    }
    console.error('Supabase fetchPermissions2 error:', permissionsError);
    return {
      success: false,
      message: 'Failed to fetch permissions',
      permissions: [],
    };
  }

  return {
    success: true,
    permissions: (permissions || []).map(p => p.permission),
  };
}

async function permit(req) {
  const supabase = getSupabase();
  const { employee, action, token } = req.body;

  if (!token || !employee) {
    return { success: false, result: 'no', message: 'Unauthorized or missing data' };
  }

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return { success: false, result: 'no', message: 'Session expired' };
  }

  const { data: employeeRecord, error: employeeError } = await supabase
    .from('employees')
    .select('id, login_code, role')
    .eq('clinic_id', token)
    .ilike('name', employee)
    .maybeSingle();

  if (employeeError || !employeeRecord) {
    return { success: false, result: 'no', message: 'Employee not found' };
  }

  // Use the clinic session token for route navigation so downstream pages
  // can validate the request using the same clinic session check.
  return { success: true, result: 'yes', login_token: clinic.id };
}

async function permitAdmin(req) {
  const supabase = getSupabase();
  const { employee, token } = req.body;
  const adminPassword = decryptMaybe(req.body.adminPassword);

  if (!token || !adminPassword) {
    return { success: false, error: 'Missing token or password' };
  }

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return { success: false, error: 'Session expired' };
  }

  const isValidAdminPassword = await verifyPassword(adminPassword, getStoredPasswordHash(clinic));
  const defaultAllowed = isDefaultLoginAllowed(clinic, adminPassword);
  if (!isValidAdminPassword && !defaultAllowed) {
    return { success: false, error: 'Invalid admin password' };
  }

  return { success: true, result: 'yes', login_token: clinic.id };
}

async function code(req) {
  const supabase = getSupabase();
  const { employee, action, token } = req.body;
  const securityCode = decryptMaybe(req.body.securityCode);

  if (!token || !employee || !securityCode) {
    return { success: false, result: 'no', message: 'Unauthorized or missing data' };
  }

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return { success: false, result: 'no', message: 'Session expired' };
  }

  const { data: employeeRecord, error: employeeError } = await supabase
    .from('employees')
    .select('id, login_code, password')
    .eq('clinic_id', token)
    .ilike('name', employee)
    .maybeSingle();

  if (employeeError || !employeeRecord) {
    return { success: false, result: 'no', message: 'Employee not found' };
  }

  const isValidPassword = await verifyPassword(securityCode, employeeRecord.password);
  const isValidLoginCode = employeeRecord.login_code === securityCode;

  if (!isValidPassword && !isValidLoginCode) {
    return { success: false, result: 'no', message: 'Invalid security code' };
  }

  return { success: true, result: 'yes' };
}

async function updatePermissions(req) {
  const supabase = getSupabase();
  const { employeeName, permissions, token, loginCode } = req.body;

  if (!token || !employeeName) {
    return { success: false, message: 'Unauthorized or missing employee name' };
  }

  // Verify clinic exists
  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return { success: false, message: 'Session expired' };
  }

  // Find employee
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id')
    .eq('clinic_id', token)
    .ilike('name', employeeName)
    .maybeSingle();

  if (employeeError || !employee) {
    return { success: false, message: 'Employee not found' };
  }

  // Delete existing permissions
  const { error: deleteError } = await supabase
    .from('permissions')
    .delete()
    .eq('employee_id', employee.id);

  if (deleteError) {
    console.error('Supabase updatePermissions delete error:', deleteError);
    return { success: false, message: 'Failed to update permissions' };
  }

  // Insert new permissions
  if (permissions && Object.keys(permissions).length > 0) {
    const permissionInserts = Object.entries(permissions)
      .filter(([key, value]) => value)
      .map(([permission, enabled]) => ({
        employee_id: employee.id,
        permission,
      }));

    if (permissionInserts.length > 0) {
      const { error: insertError } = await supabase
        .from('permissions')
        .insert(permissionInserts);

      if (insertError) {
        console.error('Supabase updatePermissions insert error:', insertError);
        return { success: false, message: 'Failed to update permissions' };
      }
    }
  }

  return { success: true, message: 'Permissions updated successfully' };
}

async function changePasswords(req) {
  const supabase = getSupabase();
  const { token, password_type } = req.body;
  const old_password = decryptMaybe(req.body.old_password);
  const new_password = decryptMaybe(req.body.new_password);

  if (!token) {
    return { success: false, message: 'Unauthorized' };
  }

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return { success: false, message: 'Session expired' };
  }

  const storedHash = getStoredPasswordHash(clinic);
  const oldPasswordIsValid = storedHash ? await verifyPassword(old_password, storedHash) : false;
  const oldPasswordIsDefault = isDefaultLoginAllowed(clinic, old_password);
  const hasStoredPassword = !!storedHash;
  if (!oldPasswordIsValid && !oldPasswordIsDefault && hasStoredPassword) {
    return { status: 'error', error: 'Old admin password does not match' };
  }

  if (!new_password) {
    return { status: 'error', error: 'New password is required' };
  }

  const hashedNewPassword = await hashPassword(new_password);
  const updatePayload = {
    password: hashedNewPassword,
    owners_info: {
      ...(clinic.owners_info || {}),
      auth: {
        ...(clinic.owners_info?.auth || {}),
        password_hash: hashedNewPassword,
      },
    },
  };

  if (password_type === 'admin') {
    updatePayload.admin_password_changed = true;
  }

  let { error: updateError } = await updateClinicWithRetry(token, updatePayload);
  if (updateError && updateError.message && updateError.message.includes('admin_password_changed')) {
    delete updatePayload.admin_password_changed;
    const fallback = await updateClinicWithRetry(token, updatePayload);
    updateError = fallback.error;
  }

  if (updateError) {
    console.error('Supabase changePasswords error:', updateError);
    return { success: false, message: `Failed to change ${password_type} password` };
  }

  return {
    status: 'success',
    message: password_type === 'admin'
      ? 'Admin password changed successfully'
      : 'Clinic password changed successfully',
  };
}

async function messagingPermission(req) {
  const supabase = getSupabase();
  const { token } = req.body;

  if (!token) {
    return { success: false, message: 'Unauthorized' };
  }

  // Verify clinic exists
  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return { success: false, message: 'Session expired' };
  }

  // For now, return 'yes' for messaging permission
  return { messages: 'yes' };
}

async function fetchSMSsettings(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);

  if (!token) {
    return { success: false, message: 'Unauthorized' };
  }

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id, name, bill_payment_sms, birthday_sms, debt_reminder_sms, custom_single_sms, custom_group_sms')
    .eq('id', token)
    .maybeSingle();

  if (clinicError) {
    if (clinicError.message && clinicError.message.toLowerCase().includes('column')) {
      return {
        success: true,
        billPayment: '0',
        birthdayMessage: '0',
        debtReminder: '0',
        customSingle: '0',
        customGroup: '0',
      };
    }
    return { success: false, message: 'Failed to fetch SMS settings' };
  }

  if (!clinic) {
    return { success: false, message: 'Session expired' };
  }

  return {
    success: true,
    billPayment: clinic.bill_payment_sms ? '1' : '0',
    birthdayMessage: clinic.birthday_sms ? '1' : '0',
    debtReminder: clinic.debt_reminder_sms ? '1' : '0',
    customSingle: clinic.custom_single_sms ? '1' : '0',
    customGroup: clinic.custom_group_sms ? '1' : '0',
  };
}

async function submitSmsSettings(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);
  const smsSettings = req.body.smsSettings || {};

  if (!token) {
    return { success: false, message: 'Unauthorized' };
  }

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return { success: false, message: 'Session expired' };
  }

  const updatePayload = {
    bill_payment_sms: Boolean(smsSettings.billPayment),
    birthday_sms: Boolean(smsSettings.birthdayMessage),
    debt_reminder_sms: Boolean(smsSettings.debtReminder),
    custom_single_sms: Boolean(smsSettings.customSingle),
    custom_group_sms: Boolean(smsSettings.customGroup),
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from('clinics')
    .update(updatePayload)
    .eq('id', token);

  if (updateError) {
    console.error('Supabase submitSmsSettings error:', updateError);
    return { success: false, message: 'Failed to save SMS settings' };
  }

  return { success: true, message: 'SMS settings saved successfully' };
}

async function sendSMS(req) {
  const supabase = getSupabase();
  const { token, phone, message, smsType, sms_type } = req.body;
  const effectiveSmsType = smsType || sms_type || 'custom';

  if (!token || !phone || !message) {
    return { success: false, message: 'Missing required parameters' };
  }

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id, subscription_balance, wallet_balance, sms_credits')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return { success: false, message: 'Session expired' };
  }

  const cost = getSmsCost(effectiveSmsType, message);
  if (cost > 0) {
    const { subscriptionBalance: currentSubscriptionBalance, walletBalance: currentWalletBalance } = normalizeBillingBalance(clinic);
    if (currentSubscriptionBalance < cost || currentWalletBalance < cost) {
      return { success: false, message: 'Insufficient subscription balance to send SMS' };
    }
  }

  try {
    const result = await sendGeniusSMS({ phone, message });
    if (!result.success) {
      return result;
    }

    if (cost > 0) {
      const recordResult = await recordSmsCharge(supabase, clinic, cost, effectiveSmsType, phone, message);
      if (!recordResult.success) {
        return { success: false, message: recordResult.message };
      }
    }

    return result;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, message: error.message || 'Error sending SMS' };
  }
}

async function sendPaymentSms(req) {
  const supabase = getSupabase();
  const {
    token,
    phoneNumber,
    phone,
    message,
    patientName,
    amount,
    balanceRemaining,
    clinicName,
    smsType,
    sms_type,
  } = req.body;
  const effectiveSmsType = smsType || sms_type || 'billing';

  if (!token) {
    return { success: false, message: 'Unauthorized' };
  }

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id, name, subscription_balance, wallet_balance, sms_credits')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return { success: false, message: 'Session expired' };
  }

  const recipientPhone = phoneNumber || phone;
  if (!recipientPhone) {
    return { success: false, message: 'Missing recipient phone number' };
  }

  const textMessage = message ||
    `Hello ${patientName || 'client'}, your payment of UGX ${amount || 0} has been received. ` +
    `${balanceRemaining != null ? `Remaining balance: UGX ${balanceRemaining}. ` : ''}` +
    `Thank you for choosing ${clinicName || clinic.name || 'our clinic'}.`;

  const cost = getSmsCost(effectiveSmsType, textMessage);
  if (cost > 0) {
    const { subscriptionBalance: currentSubscriptionBalance, walletBalance: currentWalletBalance } = normalizeBillingBalance(clinic);
    if (currentSubscriptionBalance < cost || currentWalletBalance < cost) {
      return { success: false, message: 'Insufficient subscription balance to send payment SMS' };
    }
  }

  try {
    const result = await sendGeniusSMS({ phone: recipientPhone, message: textMessage });
    if (!result.success) {
      return result;
    }

    if (cost > 0) {
      const recordResult = await recordSmsCharge(supabase, clinic, cost, effectiveSmsType, recipientPhone, textMessage);
      if (!recordResult.success) {
        return { success: false, message: recordResult.message };
      }
    }

    return result;
  } catch (error) {
    console.error('Error sending payment SMS:', error);
    return { success: false, message: error.message || 'Error sending payment SMS' };
  }
}

async function deleteReminder(req) {
  const supabase = getSupabase();
  const { appointment_id, token } = req.body;

  if (!token || !appointment_id) {
    return { success: false, message: 'Missing required parameters' };
  }

  // Verify clinic exists
  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return { success: false, message: 'Session expired' };
  }

  // Update the reminded status to 'yes'
  const { error: updateError } = await supabase
    .from('appointments')
    .update({ reminded: 'yes' })
    .eq('appointment_id', appointment_id)
    .eq('clinic_id', token);

  if (updateError) {
    console.error('Supabase deleteReminder error:', updateError);
    return { success: false, message: 'Failed to update reminder status' };
  }

  return { success: true, message: 'Reminder marked as completed' };
}

async function birthdayCount(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);

  if (!token) {
    return {
      success: false,
      message: 'Unauthorized',
      count: 0,
    };
  }

  // Return birthday count for this month (placeholder)
  return {
    success: true,
    count: 0,
    birthdays: [],
  };
}

async function countAppointments(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);

  if (!token) {
    return {
      success: false,
      message: 'Unauthorized',
      appointment_count: 0,
    };
  }

  const { count, error } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_id', token);

  if (error) {
    console.error('Supabase countAppointments error:', error);
    return {
      success: false,
      message: 'Failed to count appointments',
      appointment_count: 0,
    };
  }

  return {
    success: true,
    appointment_count: Number(count) || 0,
  };
}

async function fetchPerformance2(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);

  if (!token) {
    return {
      success: false,
      message: 'Unauthorized',
      performance: {},
    };
  }

  // Return performance data (placeholder)
  return {
    success: true,
    performance: {
      sales_today: 0,
      sales_month: 0,
      patients_today: 0,
      consultations_today: 0,
    },
  };
}

async function deleteEmployee(req) {
  const supabase = getSupabase();
  const token = getRequestToken(req);
  const { employeeId, name } = req.body;

  if (!token) {
    return { success: false, message: 'Unauthorized' };
  }

  if (!employeeId && !name) {
    return { success: false, message: 'Employee id or name is required for deletion' };
  }

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', token)
    .maybeSingle();

  if (clinicError || !clinic) {
    return { success: false, message: 'Session expired' };
  }

  const query = supabase.from('employees').delete().eq('clinic_id', token);

  if (employeeId) {
    query.eq('id', employeeId);
  } else {
    query.eq('name', name);
  }

  const { error } = await query;

  if (error) {
    console.error('Supabase deleteEmployee error:', error);
    return { success: false, message: 'Failed to delete employee', error };
  }

  return { success: true, message: 'Employee deleted successfully' };
}

const endpointMap = {
  sales: addSale,
  fetchdrugs: fetchDrugs,
  fetchcontacts: fetchContacts,
  appointments: fetchAppointments,
  registerClinic: registerClinic,
  loginClinic: loginClinic,
  fetchclinicname: fetchClinicName,
  fetchAdminData: fetchAdminData,
  fetchperformance: fetchPerformance,
  fetchperformance2: fetchPerformance2,
  security: verifySecurity,
  fetchemployees2: fetchEmployees2,
  fetchemployees: fetchEmployees,
  fetchpermissions: fetchPermissions,
  fetchpermissions2: fetchPermissions2,
  updatepermissions: updatePermissions,
  code: code,
  permit: permit,
  permitadmin: permitAdmin,
  changepasswords: changePasswords,
  messagingPermission: messagingPermission,
  sendSMS: sendSMS,
  SendPaymentSms: sendPaymentSms,
  fetchSMSsettings: fetchSMSsettings,
  submitSmsSettings: submitSmsSettings,
  deletereminder: deleteReminder,
  markWelcomeShown: markWelcomeShown,
  finishOnboarding: finishOnboarding,
  fetchbalance: fetchBalance,
  fetchcredits: fetchCredits,
  fetchcredits2: fetchCredits2,
  fetchcredits3: fetchCredits3,
  confirmcredit: confirmCredit,
  submitpayment2: submitPayment2,
  clearunconditionally: clearUnconditionally,
  birthdaycount: birthdayCount,
  dashboardtoken: dashboardToken,
  logout: logout,
  testsavailable: fetchAvailableLabTests,
  radiologytestsavailable: fetchAvailableRadiologyTests,
  suggest: suggest,
  gotodoctor: submitWalkinPatient,
  submitwalkinpt2: submitWalkinPatient,
  addcontact: addContact,
  addcontact6: addContact,
  adddrug: addDrug,
  fetchoriginaldrugs: fetchOriginalDrugs,
  deleteoriginaldrug: deleteOriginalDrug,
  stockworth: stockWorth,
  creatdrugorder: createDrugOrder,
  fetchdrugquantity: fetchDrugQuantity,
  updatedrugdetails: updatedDrugDetails,
  setprescriptiondetails: setPrescriptionDetails,
  getprescriptiondetails: getPrescriptionDetails,
  updatestockfigures: updateStockFigures,
  updatestockfiguresbatch: updateStockFiguresBatch,
  fetchprescriptiondrugs: fetchPrescriptionDrugs,
  deleteEmployee: deleteEmployee,
  countappointments: countAppointments,
  addemployee: addEmployee,
};

const authExemptEndpoints = new Set([
  'loginClinic',
  'registerClinic',
  'security',
  'dashboardToken',
]);

router.all('/:endpoint.php', async (req, res) => {
  const endpoint = req.params.endpoint;
  const handler = endpointMap[endpoint];
  const token = getRequestToken(req);

  if (!authExemptEndpoints.has(endpoint)) {
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized', error: 'Token required' });
    }

    const clinic = await getClinicByToken(token);
    if (!clinic) {
      return res.status(401).json({ success: false, message: 'Session expired', error: 'Session expired' });
    }
  }

  const protectedSettingsEndpoints = [
    'addemployee',
    'adddrug',
    'updatedrugdetails',
    'updatepermissions',
    'fetchpermissions',
    'fetchpermissions2',
    'addFamilyPlanningMethod',
    'submitlabtest',
    'addcontact',
  ];

  if (protectedSettingsEndpoints.includes(endpoint)) {
    try {
      const supabase = getSupabase();
      const token = req.body?.token || req.query?.token;
      if (token) {
        const { data: clinic, error: clinicError } = await selectClinicWithOptionalAdminFlag(supabase, token);

        if (!clinicError && clinic && clinic.is_first_login === true && clinic.admin_password_changed !== true) {
          return res.status(403).json({
            success: false,
            message: 'Complete admin password change before updating clinic settings.',
          });
        }
      }
    } catch (error) {
      console.error('Settings guardianship check failed:', error);
    }
  }

  if (!handler) {
    return res.status(501).json({
      success: false,
      message: `Endpoint /${endpoint}.php is not yet implemented on the backend.`,
      endpoint
    });
  }

  try {
    const result = await handler(req);
    res.json(result);
  } catch (error) {
    console.error(`Error handling /${endpoint}.php:`, error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

module.exports = router;
