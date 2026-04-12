
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://mdmjyvxrozxrxwmasnuq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kbWp5dnhyb3p4cnh3bWFzbnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMTExNjgsImV4cCI6MjA4OTg4NzE2OH0.1gLdW8hohxALfDd2kthsJHqPjTbztgleGizJE7IcBbU";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testSave() {
    console.log("🛠️ Tentando salvar a bio via script...");
    const { data, error } = await supabase
        .from('site_profile')
        .update({
            bio_short: "Tudo o que não mostro nas redes 💋",
            updated_at: new Date()
        })
        .eq('id', 1);

    if (error) {
        console.error("❌ Erro ao salvar:", error.message);
    } else {
        console.log("✅ Sucesso! Agora verificando...");
        const { data: check } = await supabase.from('site_profile').select('bio_short').eq('id', 1).single();
        console.log("📄 Bio atual no banco:", check.bio_short);
    }
}

testSave();
