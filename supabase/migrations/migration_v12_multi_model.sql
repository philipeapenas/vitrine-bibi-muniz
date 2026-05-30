-- =========================================================================
-- MIGRATION V12: Multi-Model (Multi-Tenant por slug)
-- Data: 29/05/2026
--
-- CONTEXTO: Transforma o schema de single-model (id=1 hardcoded)
-- para multi-model (cada modelo tem um slug unico).
-- Todas as tabelas de conteudo ganham model_slug para segmentacao.
--
-- IMPORTANTE: Executar este script no SQL Editor do Supabase Dashboard.
-- A ordem das operacoes importa (FK dependencias).
-- =========================================================================

-- ═══ 1. site_profile: remover restricao single-row e adicionar slug ═══

-- 1a. Remover o CHECK que impede mais de 1 linha
ALTER TABLE public.site_profile DROP CONSTRAINT IF EXISTS site_profile_id_check;

-- 1b. Trocar a PK de smallint para serial (permite auto-increment)
-- Primeiro, garantir que a coluna aceita valores maiores
ALTER TABLE public.site_profile ALTER COLUMN id DROP DEFAULT;

-- 1c. Adicionar coluna slug (identificador unico da modelo)
ALTER TABLE public.site_profile ADD COLUMN IF NOT EXISTS slug TEXT;

-- 1d. Migrar a linha existente
UPDATE public.site_profile SET slug = 'bibimuniz' WHERE id = 1 AND slug IS NULL;

-- 1e. Tornar slug NOT NULL e UNIQUE apos migrar
ALTER TABLE public.site_profile ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_profile_slug ON public.site_profile (slug);

-- 1f. Adicionar campo para token PushinPay individual (NULL = usa global da env)
ALTER TABLE public.site_profile ADD COLUMN IF NOT EXISTS pushinpay_token TEXT;

-- ═══ 2. site_offers: adicionar model_slug ═══

ALTER TABLE public.site_offers ADD COLUMN IF NOT EXISTS model_slug TEXT;

-- Migrar ofertas existentes
UPDATE public.site_offers SET model_slug = 'bibimuniz' WHERE model_slug IS NULL;

-- Tornar NOT NULL apos migracao
ALTER TABLE public.site_offers ALTER COLUMN model_slug SET NOT NULL;

-- Indice para queries filtradas
CREATE INDEX IF NOT EXISTS idx_site_offers_model_slug ON public.site_offers (model_slug);

-- ═══ 3. site_links: adicionar model_slug ═══

ALTER TABLE public.site_links ADD COLUMN IF NOT EXISTS model_slug TEXT;
UPDATE public.site_links SET model_slug = 'bibimuniz' WHERE model_slug IS NULL;
ALTER TABLE public.site_links ALTER COLUMN model_slug SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_site_links_model_slug ON public.site_links (model_slug);

-- ═══ 4. carousel_photos: adicionar model_slug ═══

ALTER TABLE public.carousel_photos ADD COLUMN IF NOT EXISTS model_slug TEXT;
UPDATE public.carousel_photos SET model_slug = 'bibimuniz' WHERE model_slug IS NULL;
ALTER TABLE public.carousel_photos ALTER COLUMN model_slug SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_carousel_photos_model_slug ON public.carousel_photos (model_slug);

-- ═══ 5. transactions: adicionar model_slug (nullable — historico) ═══

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS model_slug TEXT;
UPDATE public.transactions SET model_slug = 'bibimuniz' WHERE model_slug IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_model_slug ON public.transactions (model_slug);

-- ═══ 6. tracking_events: adicionar model_slug (nullable — historico) ═══

ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS model_slug TEXT;
UPDATE public.tracking_events SET model_slug = 'bibimuniz' WHERE model_slug IS NULL;
CREATE INDEX IF NOT EXISTS idx_tracking_events_model_slug ON public.tracking_events (model_slug);

-- =========================================================================
-- ✅ Pronto! Apos executar, faca o deploy do codigo atualizado no Vercel.
-- Os dados existentes da Bibi Muniz foram migrados para slug='bibimuniz'.
-- =========================================================================
