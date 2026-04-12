// ═══════════════════════════════════════════════════════
//  api/webhook-pix.js — Vercel Serverless Function
//  Recebe notificações automáticas de pagamento da PushinPay.
//
//  ⚠️  SETUP no Vercel Dashboard (Environment Variables):
//      PUSHINPAY_TOKEN       = seu_bearer_token_aqui
//      SUPABASE_URL          = https://xxxxx.supabase.co
//      SUPABASE_SERVICE_KEY  = sua_service_role_key_aqui
//      SITE_URL              = https://seu-dominio.vercel.app  (sem barra no final)
//
//  ℹ️  PushinPay tenta enviar 3x em caso de falha.
//      Sempre responder HTTP 200 o mais rápido possível.
// ═══════════════════════════════════════════════════════

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // PushinPay só envia POST — qualquer outro método retorna 405
  if (req.method !== 'POST') return res.status(405).end();

  // ─── RESPONDER 200 IMEDIATAMENTE ──────────────────────
  // PushinPay tem timeout curto. Se demorarmos, ela vai retentar
  // achando que falhou, causando processamento duplicado.
  res.status(200).json({ received: true });

  // ─── Extrair payload ──────────────────────────────────
  const {
    id,
    status,
    value,
    payer_name,
    payer_national_registration,
    end_to_end_id,
    webhook_url,
  } = req.body || {};

  // Ignorar payloads inválidos silenciosamente (log para debug)
  if (!id || !status) {
    console.warn('[webhook-pix] Payload inválido recebido:', req.body);
    return;
  }

  console.log(`[webhook-pix] Recebido: id=${id} | status=${status} | value=${value}`);

  // ─── Conexão Supabase ─────────────────────────────────
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[webhook-pix] SUPABASE_URL ou SUPABASE_SERVICE_KEY não configurados');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // ─── Atualizar transação existente no Supabase ────────
    // (A transação é criada pelo create-pix.js quando o QR é gerado)
    const updatePayload = {
      status,
      payer_name:        payer_name        || null,
      payer_doc:         payer_national_registration || null,
      end_to_end_id:     end_to_end_id     || null,
      webhook_received_at: new Date().toISOString(),
    };

    // Registrar horário de pagamento apenas quando confirmado
    if (status === 'paid') {
      updatePayload.paid_at = new Date().toISOString();
      updatePayload.event   = 'payment_approved';
    }

    const { error: updateError } = await supabase
      .from('transactions')
      .update(updatePayload)
      .eq('pushinpay_id', id);

    if (updateError) {
      // Se não achou o registro (ex: QR criado antes do log existir), faz insert
      console.warn('[webhook-pix] Update não encontrou registro, tentando insert:', updateError.message);
      await supabase.from('transactions').insert({
        pushinpay_id:    id,
        status,
        value:           value || 0,
        payer_name:      payer_name || null,
        payer_doc:       payer_national_registration || null,
        end_to_end_id:   end_to_end_id || null,
        event:           status === 'paid' ? 'payment_approved' : `pix_${status}`,
        payment_method:  'pix',
        paid_at:         status === 'paid' ? new Date().toISOString() : null,
        webhook_received_at: new Date().toISOString(),
      });
    }

    // ─── Liberação de Acesso (pagamento confirmado) ───────
    if (status === 'paid') {
      console.log(`✅ Pagamento confirmado! id=${id} | pagador=${payer_name} | value=R$${(value / 100).toFixed(2)}`);

      // TODO: Adicionar lógica de liberação de acesso aqui.
      // Exemplos conforme o produto vendido:
      //   · Telegram: enviar link de convite via Bot API
      //   · Download: registrar acesso antecipado e redirecionar
      //
      // Por enquanto, o usuário é redirecionado pelo frontend via polling (/api/check-pix)
      // Esta função garante que o Supabase está atualizado para leitura no painel.
    }

    if (status === 'expired') {
      console.log(`⏰ PIX expirado: id=${id}`);
    }

  } catch (err) {
    // Nunca lançar — response 200 já foi enviado. Logar o erro e seguir.
    console.error('[webhook-pix] Erro no processamento pós-response:', err.message);
  }
};
