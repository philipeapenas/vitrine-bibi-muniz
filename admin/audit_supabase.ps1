$SUPABASE_URL = "https://mdmjyvxrozxrxwmasnuq.supabase.co"
$ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kbWp5dnhyb3p4cnh3bWFzbnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMTExNjgsImV4cCI6MjA4OTg4NzE2OH0.1gLdW8hohxALfDd2kthsJHqPjTbztgleGizJE7IcBbU"

$headers = @{
    "apikey"        = $ANON_KEY
    "Authorization" = "Bearer $ANON_KEY"
    "Content-Type"  = "application/json"
}

Write-Host "=== TRANSACOES (ultimas 20) ===" -ForegroundColor Cyan
try {
    $r = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/transactions?select=event,plan_name,plan_value,sale_code,created_at,customer_username&order=created_at.desc&limit=20" -Headers $headers
    if ($r) { $r | Format-Table -AutoSize } else { Write-Host "Nenhuma transacao encontrada" -ForegroundColor Yellow }
} catch {
    Write-Host "Erro ao consultar transactions: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TRACKING EVENTS (ultimas 20) ===" -ForegroundColor Cyan
try {
    $r2 = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/tracking_events?select=event_type,utm_term,created_at&order=created_at.desc&limit=20" -Headers $headers
    if ($r2) { $r2 | Format-Table -AutoSize } else { Write-Host "Nenhum tracking event encontrado" -ForegroundColor Yellow }
} catch {
    Write-Host "Erro ao consultar tracking_events: $_" -ForegroundColor Red
}
