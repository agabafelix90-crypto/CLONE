const supabase = require('./supabaseClient');

async function removeMissingColumns(payload) {
  let attemptPayload = { ...payload };
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase.from('clinics').insert([attemptPayload]);
    if (!error) return { data, error: null };
    if (!error.message) return { data: null, error };
    const match = error.message.match(/Could not find the ['"]?([^'"]+)['"]? column/i);
    if (!match) return { data: null, error };
    const missingColumn = match[1];
    if (!(missingColumn in attemptPayload)) return { data: null, error };
    delete attemptPayload[missingColumn];
  }
  return { data: null, error: new Error('Failed to insert clinic after retries') };
}

module.exports = async (req, res) => {
  try {
    const body = req.method === 'POST' ? req.body : req.query;
    if (!body || (!body.name && !body.email)) {
      return res.status(400).json({ success: false, message: 'Name or email required' });
    }

    const insertPayload = {
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      owners_info: body.owners_info || null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await removeMissingColumns(insertPayload);
    if (error) {
      console.error('Supabase registration error:', error);
      return res.json({ success: false, message: error.code === '23505' ? 'Email already exists.' : (error.message || 'Registration failed.') });
    }

    const clinic = data?.[0] || null;
    return res.json({ success: true, clinic, sessionToken: clinic?.id, clinic_session_token: clinic?.id });
  } catch (err) {
    console.error('registerClinic error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
