-- Migration v3: Criar tabela site_links para botões editáveis da vitrine
-- Rodar no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS public.site_links (
    id         bigserial PRIMARY KEY,
    title      text NOT NULL,
    url        text NOT NULL,
    active     boolean DEFAULT true,
    sort_order integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT timezone('utc', now()),
    updated_at timestamp with time zone DEFAULT timezone('utc', now())
);

-- Habilitar RLS
ALTER TABLE public.site_links ENABLE ROW LEVEL SECURITY;

-- Leitura pública (anon pode ler links ativos — necessário para a vitrine funcionar)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'site_links' AND policyname = 'public_read_site_links'
    ) THEN
        CREATE POLICY public_read_site_links ON public.site_links
            FOR SELECT USING (active = true);
    END IF;
END$$;

-- Inserir links iniciais (mesmos do config.js)
INSERT INTO public.site_links (title, url, active, sort_order) VALUES
    ('Cantinho secreto 🔞', 'https://apextry.com/go/bibimunizzofc', true, 1),
    ('Privacy 🍊', 'https://bibimunizz021.online/checkout.html', true, 2)
ON CONFLICT DO NOTHING;

-- ─── Storage: Permitir leitura pública do bucket site_assets (carousel) ───
-- Cria política de leitura pública para o bucket inteiro (incluindo pasta carousel/)
INSERT INTO storage.buckets (id, name)
VALUES ('site_assets', 'site_assets')
ON CONFLICT (id) DO NOTHING;
