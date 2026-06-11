// ═══════════════════════════════════════════════════════
//  api/admin/db.js — Proxy PostgREST autenticado (Fase A.5)
//  Mantem a service_role key SOMENTE no servidor. O admin
//  envia o token (= ADMIN_PASSWORD) no header x-admin-token.
//  Espelha o envelope do supabase-js: { data, error, count }.
// ═══════════════════════════════════════════════════════

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://api-supabase.dodigital.shop';

// Allowlist: tabela -> metodos permitidos ('*' = todos).
// tracking_events/transactions sao apenas leitura no painel.
const ALLOWED = {
  site_profile: '*',
  site_offers: '*',
  site_links: '*',
  carousel_photos: '*',
  tracking_events: ['GET'],
  transactions: ['GET'],
  global_settings: '*',
};

function methodAllowed(table, method) {
  const rule = ALLOWED[table];
  if (!rule) return false;
  if (rule === '*') return true;
  return rule.includes(method);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ data: null, error: { message: 'Method not allowed' } });
  }

  const token = req.headers['x-admin-token'];
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminPass || token !== adminPass) {
    return res.status(401).json({ data: null, error: { message: 'Nao autorizado.' } });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    return res.status(500).json({ data: null, error: { message: 'Servidor sem service key configurada.' } });
  }

  const body = req.body || {};
  const table = body.table;
  const method = (body.method || 'GET').toUpperCase();
  const query = typeof body.query === 'string' ? body.query : '';
  const payload = body.body || null;
  const single = !!body.single;
  const upsert = !!body.upsert;
  const wantCount = body.count === 'exact';

  if (!table || !/^[a-z_]+$/i.test(table) || !methodAllowed(table, method)) {
    return res.status(403).json({ data: null, error: { message: 'Operacao nao permitida nesta tabela.' } });
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`;
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };
  if (single) headers['Accept'] = 'application/vnd.pgrst.object+json';

  const prefer = [];
  if (method === 'POST' || method === 'PATCH') prefer.push('return=representation');
  if (upsert) prefer.push('resolution=merge-duplicates');
  if (wantCount) prefer.push('count=exact');
  if (prefer.length) headers['Prefer'] = prefer.join(',');

  try {
    const r = await fetch(url, {
      method,
      headers,
      body: payload != null ? JSON.stringify(payload) : undefined,
    });

    const text = await r.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }

    // count via Content-Range (ex: "0-0/1")
    let count = null;
    const range = r.headers.get('content-range');
    if (range && range.includes('/')) {
      const total = range.split('/')[1];
      if (total && total !== '*') count = parseInt(total, 10);
    }

    if (!r.ok) {
      const message = (data && data.message) || (typeof data === 'string' ? data : 'Erro no banco') || `HTTP ${r.status}`;
      return res.status(200).json({ data: null, error: { message, status: r.status }, count: null });
    }

    return res.status(200).json({ data, error: null, count });
  } catch (err) {
    return res.status(200).json({ data: null, error: { message: err.message }, count: null });
  }
};
