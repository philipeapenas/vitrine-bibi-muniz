// ═══════════════════════════════════════════════════════
//  api/verify-access.js — Vercel Serverless Function
//  Verifica a autenticidade do pagamento no Supabase
//  impede o acesso direto à página de obrigado.html
// ═══════════════════════════════════════════════════════

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;

  if (!id || id === '—') {
    return res.status(401).json({ authorized: false, message: 'ID de transação ausente.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[verify-access] Supabase config missing');
    return res.status(500).json({ error: 'Erro de configuração no servidor.' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Busca a transação pelo ID da PushinPay ou pelo ID interno
    const { data, error } = await supabase
      .from('transactions')
      .select('status, paid_at, value')
      .or(`pushinpay_id.eq.${id},id.eq.${id}`)
      .single();

    if (error || !data) {
      console.warn(`[verify-access] Transação não encontrada: ${id}`);
      return res.status(404).json({ authorized: false, message: 'Transação não encontrada.' });
    }

    // Só autoriza se status for 'paid'
    if (data.status === 'paid' || data.status === 'payment_approved') {
      return res.status(200).json({
        authorized: true,
        paid_at: data.paid_at,
        value: data.value
      });
    }

    return res.status(403).json({ 
      authorized: false, 
      status: data.status,
      message: 'Pagamento ainda não confirmado ou expirado.' 
    });

  } catch (err) {
    console.error('[verify-access] Catch:', err);
    return res.status(500).json({ error: 'Erro interno ao verificar acesso.' });
  }
};
