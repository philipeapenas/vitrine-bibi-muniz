
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("--- Schema Check ---");
    
    // Check transactions
    const { data: trans, error: err1 } = await supabase.from('transactions').select('*').limit(1);
    if (err1) {
        console.error("Error fetching transactions:", err1.message);
    } else {
        console.log("Columns in 'transactions':", Object.keys(trans[0] || {}));
    }

    // Check tracking_events
    const { data: track, error: err2 } = await supabase.from('tracking_events').select('*').limit(1);
    if (err2) {
        console.error("Error fetching tracking_events:", err2.message);
    } else {
        console.log("Columns in 'tracking_events':", Object.keys(track[0] || {}));
    }
}

checkSchema();
