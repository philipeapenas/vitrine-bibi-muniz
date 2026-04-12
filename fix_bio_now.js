
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://mdmjyvxrozxrxwmasnuq.supabase.co";
// Usando a chave anon que está no diagnose-db.js
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kbWp5dnhyb3p4cnh3bWFzbnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMTExNjgsImV4cCI6MjA4OTg4NzE2OH0.1gLdW8hohxALfDd2kthsJHqPjTbztgleGizJE7IcBbU";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fix() {
    console.log("⚡ Forçando atualização via SDK...");
    const newBio = "Tudo o que eu não mostro nas redes\n💋";
    
    const { data, error } = await supabase
        .from('site_profile')
        .update({ 
            bio_short: newBio,
            updated_at: new Date() 
        })
        .eq('id', 1)
        .select();

    if (error) {
        console.error("❌ Erro:", error.message);
    } else {
        console.log("✅ Sucesso! Nova bio no banco:", data[0].bio_short);
    }
}

fix();
