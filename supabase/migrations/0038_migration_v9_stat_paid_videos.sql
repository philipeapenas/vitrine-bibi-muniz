-- Migration v9: Adicionar campo stat_paid_videos para o ícone de cadeado
-- Rodar no SQL Editor do Supabase

ALTER TABLE public.site_profile
    ADD COLUMN IF NOT EXISTS stat_paid_videos text DEFAULT '0 Vídeos';

-- Comentário para registro
COMMENT ON COLUMN public.site_profile.stat_paid_videos IS 'Estatística de vídeos pagos exibida no ícone de cadeado do checkout.';
