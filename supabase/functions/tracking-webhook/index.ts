// supabase/functions/tracking-webhook/index.ts
// Recebe webhooks de eventos (user_joined, payment_created, payment_approved) e grava no supabase.
// Versão simplificada: sem UTMs. Timestamps em horário de Brasília.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    })
  }

  try {
    if (req.method !== 'POST') {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const payload = await req.json();
    
    // Environment Validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Helper: Converter timestamp Unix para horário de Brasília com offset correto.
    // Importante: o sufixo "-03:00" garante que o Supabase (timestamptz) armazene
    // o UTC real, evitando a diferença de 3h no display da dashboard.
    function toBrasiliaISO(unixTimestamp?: number): string {
      const date = unixTimestamp ? new Date(unixTimestamp * 1000) : new Date();
      const spStr = date.toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).replace(" ", "T");
      return spStr + "-03:00";
    }

    // Extraction & Transformation (sem UTMs)
    // Nota: sale_code vem da Apex já no horário de Brasília — não normalizar.
    const eventType = payload.event || "unknown";

    const dataToInsert = {
      created_at: toBrasiliaISO(payload.timestamp),
      event: eventType,
      bot_id: payload.bot_id ? String(payload.bot_id) : null,
      customer_chat_id: payload.customer?.chat_id ? String(payload.customer.chat_id) : null,
      customer_username: payload.customer?.username || null,
      sale_code: payload.transaction?.sale_code || null,
      plan_name: payload.transaction?.plan_name || null,
      plan_value: payload.transaction?.plan_value ? parseFloat(payload.transaction.plan_value) : null,
      payment_method: payload.transaction?.payment_method || null,
      click_id: payload.tracking?.click_id || null,
    };

    const { error } = await supabase
      .from('transactions')
      .insert(dataToInsert);

    if (error) {
      console.error("[CRITICAL] Supabase Insert Failed:", error);
      throw error;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Event '${eventType}' processed.` 
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[ERROR] Webhook processing exception:", errorMsg);
    
    return new Response(JSON.stringify({ error: errorMsg }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
