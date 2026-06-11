-- Torna o bucket site_assets público para que as imagens sejam carregadas sem autenticação
UPDATE storage.buckets SET public = true WHERE id = 'site_assets';
