-- =========================================================================
-- PATCH: Correção de Esquema para Checkout e Tracking (13/04/2026)
-- Resolve Erro 500 (register-lead) e Erro 400 (tracker.js)
-- Execute no SQL Editor do Supabase Dashboard
-- =========================================================================

-- 1. Garantir colunas na tabela TRANSACTIONS
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS client_id text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS sale_code text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS utm_term text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS utm_content text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS src text;

-- 2. Garantir colunas na tabela TRACKING_EVENTS
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS clicked_url text;
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS click_type text;
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS utm_term text;
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS utm_content text;
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS utm_id text;
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS src text;

-- 3. Índices extras para performance
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON public.transactions (client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_sale_code ON public.transactions (sale_code);

-- ✅ Pronto! Execute o comando acima para estabilizar o sistema.
