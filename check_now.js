
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://mdmjyvxrozxrxwmasnuq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kbWp5dnhyb3p4cnh3bWFzbnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMTExNjgsImV4cCI6MjA4OTg4NzE2OH0.1gLdW8hohxALfDd2kthsJHqPjTbztgleGizJE7IcBbU";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    console.log("🧐 Verificando DB agora...");
    const { data, error } = await supabase
        .from('site_profile')
        .select('bio_short, updated_at')
        .eq('id', 1)
        .single();

    if (error) {
        console.error("❌ Erro:", error.message);
    } else {
        console.log("📄 Bio no Banco:", data.bio_short);
        console.log("🕒 Última atualização (UTC):", data.updated_at);
        console.log("🕒 Hora agora (UTC):", new Date().toISOString());
    }
}

check();
