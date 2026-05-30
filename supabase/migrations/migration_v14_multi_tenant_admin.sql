-- Migration V14: Ajustes de Admin e Global Settings
-- Criado para suportar o Token Global do PushinPay e simplificação da Vitrine (Botão único)

-- 1. Cria a tabela global_settings
CREATE TABLE IF NOT EXISTS global_settings (
    id INT PRIMARY KEY,
    pushinpay_token TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insere o registro id=1 caso não exista
INSERT INTO global_settings (id, pushinpay_token) 
VALUES (1, '') 
ON CONFLICT (id) DO NOTHING;

-- 2. Adiciona colunas do botão único em site_profile
ALTER TABLE site_profile 
ADD COLUMN IF NOT EXISTS main_button_text TEXT DEFAULT 'Ver conteúdo exclusivo',
ADD COLUMN IF NOT EXISTS main_button_url TEXT;

-- 3. Limpeza das tabelas antigas da vitrine (opcional, mas recomendado)
DROP TABLE IF EXISTS site_links CASCADE;
DROP TABLE IF EXISTS carousel_photos CASCADE;

-- 4. Limpeza da coluna pulse_enabled (já não será mais usada)
ALTER TABLE site_profile DROP COLUMN IF EXISTS pulse_enabled;
