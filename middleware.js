export const config = {
  matcher: ['/obrigado.html'],
};

export default async function middleware(request) {
  const url = new URL(request.url);

  // Barreira de Segurança: Página de Obrigado (Instablock)
  if (url.pathname === '/obrigado.html') {
    const txId = url.searchParams.get('tx') || url.searchParams.get('tx_id');
    
    // Se não tem ID, instablock imediato para o checkout
    if (!txId || txId === '—') {
      return Response.redirect(new URL('/checkout.html', request.url), 307);
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const checkRes = await fetch(
          `${supabaseUrl}/rest/v1/transactions?pushinpay_id=eq.${txId}&select=status`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (checkRes.ok) {
          const data = await checkRes.json();
          const isPaid = data.some(t => t.status === 'paid' || t.status === 'payment_approved');
          
          if (!isPaid) {
            console.log(`[Middleware] Instablock: Pagamento não confirmado para ${txId}`);
            return Response.redirect(new URL('/checkout.html', request.url), 307);
          }
        }
      } catch (err) {
        console.error('[Middleware] Erro ao validar transação:', err.message);
      }
    }
  }
}
