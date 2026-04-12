-- Adiciona coluna para o hook de deploy da Vercel
ALTER TABLE site_profile ADD COLUMN IF NOT EXISTS vercel_deploy_hook_url TEXT;

-- Comentário para documentação
COMMENT ON COLUMN site_profile.vercel_deploy_hook_url IS 'URL do Deploy Hook da Vercel para acionar builds automáticos via Admin.';
