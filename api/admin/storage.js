// ═══════════════════════════════════════════════════════
//  api/admin/storage.js — Upload/remove no bucket site_assets
//  (Fase A.5). Service key fica SOMENTE no servidor.
//  Auth: header x-admin-token (= ADMIN_PASSWORD).
//  Upload via base64 no corpo JSON (limite ~4.5MB da Vercel;
//  ok para imagens de config — videos ficam para a Fase C).
// ═══════════════════════════════════════════════════════

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://api-supabase.dodigital.shop';
const BUCKET = 'site_assets';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ data: null, error: { message: 'Method not allowed' } });
  }

  const token = req.headers['x-admin-token'];
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminPass || token !== adminPass) {
    return res.status(401).json({ data: null, error: { message: 'Nao autorizado.' } });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    return res.status(500).json({ data: null, error: { message: 'Servidor sem service key configurada.' } });
  }

  const supabase = createClient(SUPABASE_URL, serviceKey);
  const { action, path, paths, contentType, upsert, dataBase64 } = req.body || {};

  try {
    if (action === 'upload') {
      if (!path || !dataBase64) {
        return res.status(400).json({ data: null, error: { message: 'path e dataBase64 sao obrigatorios.' } });
      }
      const buffer = Buffer.from(dataBase64, 'base64');
      const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
        contentType: contentType || 'application/octet-stream',
        upsert: !!upsert,
      });
      if (error) return res.status(200).json({ data: null, error: { message: error.message } });
      return res.status(200).json({ data: { path }, error: null });
    }

    if (action === 'remove') {
      if (!Array.isArray(paths) || paths.length === 0) {
        return res.status(400).json({ data: null, error: { message: 'paths (array) e obrigatorio.' } });
      }
      const { error } = await supabase.storage.from(BUCKET).remove(paths);
      if (error) return res.status(200).json({ data: null, error: { message: error.message } });
      return res.status(200).json({ data: { removed: paths }, error: null });
    }

    return res.status(400).json({ data: null, error: { message: 'Acao desconhecida.' } });
  } catch (err) {
    return res.status(200).json({ data: null, error: { message: err.message } });
  }
};
