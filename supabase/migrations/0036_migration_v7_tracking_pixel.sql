-- =========================================================================
-- MIGRATION: Atribuição Full Funnel + Pixel Configuration (12/04/2026)
-- Restaura colunas UTM e adiciona suporte dinâmico ao Facebook Pixel
-- Execute no SQL Editor do Supabase Dashboard
-- =========================================================================

-- 1. tracking_events: Restaurar colunas UTM para atribuição granulada
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS utm_term text;
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS utm_content text;
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS utm_id text;
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS src text;

-- 2. transactions: Restaurar colunas UTM para vincular vendas à origem
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS utm_term text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS utm_content text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS src text;

-- 3. site_profile: Adicionar configuração do Facebook Pixel
ALTER TABLE public.site_profile ADD COLUMN IF NOT EXISTS facebook_pixel_id text;

-- 4. Índices para performance em relatórios
CREATE INDEX IF NOT EXISTS idx_tracking_utm_source ON public.tracking_events (utm_source);
CREATE INDEX IF NOT EXISTS idx_transactions_utm_source ON public.transactions (utm_source);
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS event_type text;
CREATE INDEX IF NOT EXISTS idx_tracking_event_type ON public.tracking_events (event_type);

-- ✅ Pronto! O sistema de dados está preparado para o tracking 360º.
