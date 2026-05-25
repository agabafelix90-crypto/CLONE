function buildTarget(req, path) {
  if (process.env.API_BASE_URL) {
    return `${process.env.API_BASE_URL.replace(/\/$/, '')}${path}`;
  }

  const host = req.headers.host || 'localhost:5000';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  return `${protocol}://${host}${path}`;
}

async function getRawBody(req) {
  return await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  try {
    const rawBody = ['GET', 'HEAD'].includes(req.method) ? undefined : await getRawBody(req);

    const headers = {};
    // copy request headers but avoid hop-by-hop / host
    for (const k of Object.keys(req.headers || {})) {
      if (['host', 'connection', 'content-length'].includes(k.toLowerCase())) continue;
      headers[k] = req.headers[k];
    }

    const target = buildTarget(req, '/api/loginClinic');
    const fetchRes = await fetch(target, {
      method: req.method,
      headers,
      body: rawBody,
    });

    const contentType = fetchRes.headers.get('content-type') || 'text/plain';
    const text = await fetchRes.text();

    res.setHeader('Content-Type', contentType);
    // Ensure CORS headers are present on every response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(fetchRes.status || 200).send(text);
  } catch (err) {
    console.error('proxy-login error:', err);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(502).json({ success: false, message: 'Proxy error' });
  }
};
