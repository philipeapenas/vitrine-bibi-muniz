-- =========================================================================
-- MIGRAÇÃO: Simplificação do Tracking (25/03/2026)
-- Remover colunas UTM de ambas tabelas + adicionar click_type
-- Execute este script no SQL Editor do Supabase Dashboard
-- =========================================================================

-- 1. tracking_events: Remover colunas UTM
ALTER TABLE public.tracking_events DROP COLUMN IF EXISTS utm_source;
ALTER TABLE public.tracking_events DROP COLUMN IF EXISTS utm_medium;
ALTER TABLE public.tracking_events DROP COLUMN IF EXISTS utm_campaign;
ALTER TABLE public.tracking_events DROP COLUMN IF EXISTS utm_term;
ALTER TABLE public.tracking_events DROP COLUMN IF EXISTS utm_content;
ALTER TABLE public.tracking_events DROP COLUMN IF EXISTS utm_id;

-- 2. tracking_events: Adicionar coluna click_type
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS click_type text;

-- 3. transactions: Remover colunas UTM
ALTER TABLE public.transactions DROP COLUMN IF EXISTS utm_source;
ALTER TABLE public.transactions DROP COLUMN IF EXISTS utm_campaign;
ALTER TABLE public.transactions DROP COLUMN IF EXISTS utm_medium;

-- ✅ Pronto! As tabelas agora estão limpas e otimizadas.
