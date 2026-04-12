
// Usando fetch nativo do Node 22

const SUPABASE_URL = "https://mdmjyvxrozxrxwmasnuq.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kbWp5dnhyb3p4cnh3bWFzbnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMTExNjgsImV4cCI6MjA4OTg4NzE2OH0.1gLdW8hohxALfDd2kthsJHqPjTbztgleGizJE7IcBbU";

async function diagnose() {
    console.log("🔍 Iniciando Diagnóstico de Dados...");
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/site_profile?id=eq.1&select=*`, {
            headers: {
                "apikey": SUPABASE_ANON,
                "Authorization": "Bearer " + SUPABASE_ANON
            }
        });
        const data = await res.json();
        console.log("✅ Dados no Supabase (Site Profile):");
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("❌ Erro ao buscar dados:", e.message);
    }
}

diagnose();
