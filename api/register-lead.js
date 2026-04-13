// ═══════════════════════════════════════════════════════
//  api/register-lead.js — Vercel Serverless Function
//  Registra o visitante no banco como um Lead persistente
// ═══════════════════════════════════════════════════════

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { clientId, attribution } = req.body || {};

  if (!clientId) {
    return res.status(400).json({ error: 'clientId é obrigatório' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Configuração do Supabase ausente no Vercel' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Registra a visita inicial como um Lead
    const { error } = await supabase.from('transactions').insert({
      client_id:    clientId,
      event:        'checkout_visit',
      plan_name:    'Checkout Iniciado',
      status:       'created',
      // UTMs e Atribuição para histórico
      sale_code:    attribution?.sale_code || null,
      utm_source:   attribution?.utm_source || null,
      utm_medium:   attribution?.utm_medium || null,
      utm_campaign: attribution?.utm_campaign || null,
      utm_term:     attribution?.utm_term || null,
      utm_content:  attribution?.utm_content || null,
      src:          attribution?.src || null,
    });

    if (error) {
      console.error('[register-lead] Supabase Error:', error);
      throw error;
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Visitante registrado como Lead' 
    });

  } catch (err) {
    console.error('[register-lead] Catch:', err.message);
    return res.status(500).json({ error: 'Erro interno ao registrar lead' });
  }
};
