// ═══════════════════════════════════════════════════════
//  api/check-pix.js — Vercel Serverless Function
//  Consulta status de transação PIX na PushinPay
//
//  ⚠️  Limite: PushinPay permite 1 consulta/minuto por transação
// ═══════════════════════════════════════════════════════

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Parâmetro id obrigatório' });

  const token = process.env.PUSHINPAY_TOKEN;
  if (!token) return res.status(500).json({ error: 'PUSHINPAY_TOKEN não configurado' });

  try {
    const pushinRes = await fetch(`https://api.pushinpay.com.br/api/transactions/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const data = await pushinRes.json();

    if (!pushinRes.ok) {
      console.error('[check-pix] PushinPay error:', data);
      return res.status(pushinRes.status).json({ error: data?.message || 'Erro PushinPay' });
    }

    return res.status(200).json({
      id: data.id,
      status: data.status,          // "created" | "paid" | "canceled"
      value: data.value,
      payer_name: data.payer_name,
      end_to_end_id: data.end_to_end_id,
    });

  } catch (err) {
    console.error('[check-pix] Catch:', err);
    return res.status(500).json({ error: 'Erro interno ao consultar PIX' });
  }
};
