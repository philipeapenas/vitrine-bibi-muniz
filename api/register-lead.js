// ═══════════════════════════════════════════════════════
//  api/register-lead.js — Vercel Serverless Function
//  Registra CADA AÇÃO do visitante como uma nova linha no banco.
//  Modelo INSERT (acumulativo) — nunca sobrescreve ações anteriores.
// ═══════════════════════════════════════════════════════

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { clientId, attribution, event, status, plan_name, plan_value } = req.body || {};

  if (!clientId) {
    return res.status(400).json({ error: 'clientId é obrigatório' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[register-lead] Configuração do Supabase ausente no Vercel');
    return res.status(200).json({ success: true, warning: 'Log ignorado' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // INSERT: Cada ação gera uma nova linha — histórico completo do lead
    const { data, error } = await supabase.from('transactions').insert({
      client_id:    clientId,
      event:        event    || 'checkout_visit',
      plan_name:    plan_name || 'Checkout Iniciado',
      plan_value:   Number(plan_value || 0) > 0 ? plan_value : 0,
      status:       status   || 'created',
      
      // Atribuição: salva o sale_code que veio com o lead nessa ação
      sale_code:    attribution?.sale_code    || null,
      utm_source:   attribution?.utm_source   || null,
      utm_medium:   attribution?.utm_medium   || null,
      utm_campaign: attribution?.utm_campaign || null,
      utm_term:     attribution?.utm_term     || null,
      utm_content:  attribution?.utm_content  || null,
      src:          attribution?.src          || null,
    });

    if (error) {
      console.error('[register-lead] Supabase Error:', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Ação registrada com sucesso' 
    });

  } catch (err) {
    console.error('[register-lead] Catch:', err.message);
    // Retornamos 200 mesmo no erro para NÃO quebrar o checkout do usuário final
    return res.status(200).json({ success: true, error_catch: err.message });
  }
};
