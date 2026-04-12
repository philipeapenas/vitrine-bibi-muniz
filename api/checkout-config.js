// Edge Function Vercel — checkout-config (v2 com campos completos)
export const config = { runtime: 'edge' };

const SUPABASE_URL     = 'https://mdmjyvxrozxrxwmasnuq.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kbWp5dnhyb3p4cnh3bWFzbnVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDMxMTE2OCwiZXhwIjoyMDg5ODg3MTY4fQ.GWXmfDW1ShSmScUxDUPRCXyI_AJIwDC5AHJW-umApJA';

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json'
};

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const [profileRes, offersRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/site_profile?select=*&order=id.asc&limit=1`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/site_offers?select=*&order=created_at.asc`, { headers }),
    ]);

    if (!profileRes.ok) throw new Error("Failed to fetch profile");
    if (!offersRes.ok) throw new Error("Failed to fetch offers");

    const profileData = await profileRes.json();
    const profile     = profileData.length > 0 ? profileData[0] : null;

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
