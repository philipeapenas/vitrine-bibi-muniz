-- Migration: Adicionar campos de configuração completa ao site_profile
-- Rodar no SQL Editor do Supabase

ALTER TABLE public.site_profile
    ADD COLUMN IF NOT EXISTS location text,
    -- Estatísticas aparentes (feed)
    ADD COLUMN IF NOT EXISTS stat_likes text DEFAULT '245K',
    ADD COLUMN IF NOT EXISTS stat_posts text DEFAULT '3.166 Postagens',
    ADD COLUMN IF NOT EXISTS stat_medias text DEFAULT '3.387 Mídias',
    ADD COLUMN IF NOT EXISTS stat_images text DEFAULT '1.6K',
    ADD COLUMN IF NOT EXISTS stat_videos text DEFAULT '1.8K',
    -- Página de Obrigado (Pós-Venda)
    ADD COLUMN IF NOT EXISTS thankyou_title text DEFAULT 'Pagamento Aprovado!',
    ADD COLUMN IF NOT EXISTS thankyou_message text DEFAULT 'Obrigada! O seu acesso VIP exclusivo acabou de ser liberado.',
    ADD COLUMN IF NOT EXISTS thankyou_btn_text text DEFAULT 'Acessar Grupo VIP',
    ADD COLUMN IF NOT EXISTS thankyou_btn_url text DEFAULT 'https://t.me/seu_grupo_vip',
    -- Preços e Pagamento
    ADD COLUMN IF NOT EXISTS payment_value_cents integer DEFAULT 4890,
    ADD COLUMN IF NOT EXISTS payment_token text;
