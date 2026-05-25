const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function getStoredPasswordHash(record) {
  if (!record) return null;
  if (record.password) return record.password;
  if (record.owners_info && typeof record.owners_info === 'object') {
    return record.owners_info.auth?.password_hash || null;
  }
  return null;
}

async function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;
  if (storedHash.startsWith('$2')) return bcrypt.compare(password, storedHash);
  return password === storedHash;
}

module.exports = async (req, res) => {
  try {
    const body = req.method === 'POST' ? req.body : req.query;
    const rawClinicName = String(body.clinicName || body.name || body.clinic_name || body.email || '').trim();
    const emailInput = String(body.email || '').trim();
    const password = body.password || '';

    if (!rawClinicName || !password) {
      return res.status(400).json({ success: false, message: 'Clinic name and password are required' });
    }

    const isEmailLogin = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawClinicName) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput);
    const loginIdentifier = isEmailLogin ? (emailInput || rawClinicName) : rawClinicName;

    let clinic = null;

    if (isEmailLogin) {
      const { data: clinicByEmail, error } = await supabase.from('clinics').select('*').ilike('email', loginIdentifier).maybeSingle();
      if (error) {
        console.error('Supabase email query error:', error);
        return res.status(500).json({ success: false, message: 'Login failed.' });
      }
      clinic = clinicByEmail;
    }

    if (!clinic) {
      const { data: clinicsByName, error } = await supabase.from('clinics').select('*').ilike('name', rawClinicName).limit(3);
      if (error) {
        console.error('Supabase name query error:', error);
        return res.status(500).json({ success: false, message: 'Login failed.' });
      }
      if (Array.isArray(clinicsByName)) {
        if (clinicsByName.length === 1) {
          clinic = clinicsByName[0];
        } else if (clinicsByName.length > 1) {
          return res.json({ success: false, message: 'Multiple clinics found with this name. Please login using your registered email address.' });
        }
      }
    }

    if (!clinic) return res.json({ success: false, message: 'Invalid credentials' });

    const storedPasswordHash = getStoredPasswordHash(clinic);
    const passwordMatches = storedPasswordHash ? await verifyPassword(password, storedPasswordHash) : false;

    if (!passwordMatches) return res.json({ success: false, message: 'Invalid credentials' });

    // Update session timestamps
    try {
      const now = new Date();
      const newExpiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      await supabase.from('clinics').update({ last_active_at: now.toISOString(), session_expires_at: newExpiresAt.toISOString() }).eq('id', clinic.id).throwOnError(false);
    } catch (err) {
      console.warn('Failed to update session timestamps:', err.message || err);
    }

    return res.json({ success: true, clinic, sessionToken: clinic.id, clinic_session_token: clinic.id });
  } catch (err) {
    console.error('loginClinic error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
