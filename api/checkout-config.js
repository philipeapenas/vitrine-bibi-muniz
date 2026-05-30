// Edge Function Vercel — checkout-config (v3 multi-model)
export const config = { runtime: 'edge' };

const SUPABASE_URL     = process.env.SUPABASE_URL || 'https://mdmjyvxrozxrxwmasnuq.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY;

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json'
};

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  if (!SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'SUPABASE_SERVICE_KEY nao configurada no servidor' }), { status: 500 });
  }

  // Extrair slug da modelo via query string
  const url = new URL(req.url);
  const modelSlug = url.searchParams.get('model');

  if (!modelSlug) {
    return new Response(JSON.stringify({ error: 'Parametro model obrigatorio (ex: ?model=bibimuniz)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const [profileRes, offersRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/site_profile?select=*&slug=eq.${encodeURIComponent(modelSlug)}`, {
        headers: { ...headers, 'Accept': 'application/vnd.pgrst.object+json' }
      }),
      fetch(`${SUPABASE_URL}/rest/v1/site_offers?select=*&model_slug=eq.${encodeURIComponent(modelSlug)}&order=created_at.asc`, { headers }),
    ]);

    if (profileRes.status === 406) {
      // PostgREST retorna 406 quando .object+json nao encontra resultado
      return new Response(JSON.stringify({ error: 'Modelo nao encontrada: ' + modelSlug }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (!profileRes.ok) throw new Error("Failed to fetch profile");
    if (!offersRes.ok) throw new Error("Failed to fetch offers");

    const profile = await profileRes.json();
    
    // Normalizar caminhos de imagem para absolutos caso venham do banco como relativos (assets/...)
    if (profile) {
      if (profile.profile_picture_url && profile.profile_picture_url.startsWith('assets/')) {
        profile.profile_picture_url = '/' + profile.profile_picture_url;
      }
      if (profile.cover_picture_url && profile.cover_picture_url.startsWith('assets/')) {
        profile.cover_picture_url = '/' + profile.cover_picture_url;
      }
    }
    let offers = await offersRes.json();
    offers     = offers.filter(o => o.active);

    return new Response(JSON.stringify({ success: true, profile, offers }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 's-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
