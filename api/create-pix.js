// ═══════════════════════════════════════════════════════
//  api/create-pix.js — Vercel Serverless Function
//  Proxy seguro para PushinPay (evita expor token no browser)
//
//  ⚠️  SETUP no Vercel Dashboard (Environment Variables):
//      PUSHINPAY_TOKEN       = seu_bearer_token_aqui
//      SUPABASE_URL          = https://xxxxx.supabase.co
//      SUPABASE_SERVICE_KEY  = sua_service_role_key_aqui
//      SITE_URL              = https://seu-dominio.vercel.app  (sem barra no final)
// ═══════════════════════════════════════════════════════

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.PUSHINPAY_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'PUSHINPAY_TOKEN não configurado no Vercel' });
  }

  const body = req.body || {};
  const { value, plan, attribution } = body;

  if (!value || typeof value !== 'number' || value < 50) {
    return res.status(400).json({ error: 'value deve ser número >= 50 (centavos)' });
  }

  // ─── Montar webhook_url dinâmico ──────────────────────
  // SITE_URL: URL base do projeto no Vercel (ex: https://vitrine-bibi.vercel.app)
  // Sem SITE_URL, o webhook não é enviado — pagamento confirmado só por polling.
  const siteUrl = process.env.SITE_URL || '';
  const webhookUrl = siteUrl ? `${siteUrl}/api/webhook-pix` : undefined;

  try {
    const pushinBody = { value };
    if (webhookUrl) pushinBody.webhook_url = webhookUrl;

    const pushinRes = await fetch('https://api.pushinpay.com.br/api/pix/cashIn', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(pushinBody),
    });

    const data = await pushinRes.json();

    if (!pushinRes.ok) {
      console.error('[create-pix] PushinPay error:', data);
      return res.status(pushinRes.status).json({ error: data?.message || 'Erro PushinPay' });
    }

    // ─── Log no Supabase (não-bloqueante) ─────────────────
    // Erros aqui NÃO impedem a resposta ao usuário — transação já foi criada na PushinPay
    logToSupabase(data, plan, attribution || {}).catch(err =>
      console.warn('[create-pix] Supabase log falhou (não crítico):', err.message)
    );

    return res.status(200).json({
      id:             data.id,
      qr_code:        data.qr_code,
      qr_code_base64: data.qr_code_base64,
      status:         data.status,
      value:          data.value,
    });

  } catch (err) {
    console.error('[create-pix] Catch:', err);
    return res.status(500).json({ error: 'Erro interno ao gerar PIX' });
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function logToSupabase(pixData, plan, attribution) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) return; // Silencioso — env vars opcionais

  const supabase = createClient(supabaseUrl, supabaseKey);

  await supabase.from('transactions').insert({
    pushinpay_id:   pixData.id,
    status:         pixData.status,      // 'created'
    value:          pixData.value,
    plan_name:      plan || null,
    event:          'payment_created',
    payment_method: 'pix',
    webhook_url:    pixData.webhook_url || null,
    // UTMs, Sale Code e Fonte
    sale_code:      attribution.sale_code || null,
    utm_source:     attribution.utm_source || null,
    utm_medium:     attribution.utm_medium || null,
    utm_campaign:   attribution.utm_campaign || null,
    utm_term:       attribution.utm_term || null,
    utm_content:    attribution.utm_content || null,
    src:            attribution.src || null,
  });
}

