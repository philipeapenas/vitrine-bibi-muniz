-- =========================================================================
-- MIGRATION: Fix Tracking Funnel + Unique Client ID (15/04/2026)
-- Resolve Erro 400 no tracker.js e habilita UPSERT na tabela transactions
-- =========================================================================

-- 1. tracking_events: Adicionar colunas faltantes para evitar Erro 400
-- Estas colunas são enviadas pelo tracker.js no evento 'click_plan'
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS plan_id text;
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS plan_name text;
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS plan_value numeric;
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS client_id text;
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS sale_code text;

-- 2. transactions: Garantir colunas e unicidade do client_id
-- Adiciona a coluna status se não existir para evitar o erro 42703
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS client_id text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS sale_code text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS value numeric;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS plan_value numeric;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS plan_name text;

-- Isso consolida o funil (Iniciou -> Viu Oferta -> Gerou Pix) em um único registro
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'transactions_client_id_key'
    ) THEN
        ALTER TABLE public.transactions ADD CONSTRAINT transactions_client_id_key UNIQUE (client_id);
    END IF;
END $$;

-- 3. Índices extras para a página de obrigado (validação rápida)
CREATE INDEX IF NOT EXISTS idx_transactions_client_id_status ON public.transactions (client_id, status);

-- ✅ Pronto! Execute este script no SQL Editor do Supabase Dashboard.
