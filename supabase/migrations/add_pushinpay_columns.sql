-- =========================================================================
-- MIGRATION: Adiciona colunas para integração direta com PushinPay API
-- Execute no SQL Editor do Supabase após o supabase_setup.sql
-- =========================================================================

-- Adicionar coluna pushinpay_id (UUID da transação na PushinPay)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS pushinpay_id text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'created',
  ADD COLUMN IF NOT EXISTS payer_doc text,
  ADD COLUMN IF NOT EXISTS end_to_end_id text,
  ADD COLUMN IF NOT EXISTS webhook_url text,
  ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS webhook_received_at timestamp with time zone;

-- Índice para lookup rápido por pushinpay_id (webhook usa muito)
CREATE INDEX IF NOT EXISTS idx_transactions_pushinpay_id
  ON public.transactions (pushinpay_id);

-- Índice para lookup por status (dashboard)
CREATE INDEX IF NOT EXISTS idx_transactions_status
  ON public.transactions (status);
