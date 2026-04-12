
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://mdmjyvxrozxrxwmasnuq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kbWp5dnhyb3p4cnh3bWFzbnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMTExNjgsImV4cCI6MjA4OTg4NzE2OH0.1gLdW8hohxALfDd2kthsJHqPjTbztgleGizJE7IcBbU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listAll() {
    console.log("🔍 Listando todos os registros de site_profile...");
    const { data, error } = await supabase.from('site_profile').select('id, creator_name, bio_short');
    if (error) console.error(error);
    else console.log("Registros encontrados:", JSON.stringify(data, null, 2));
}
listAll();
