-- =========================================================================
-- MIGRATION: Remove UNIQUE client_id, habilitar modelo INSERT acumulativo
-- Data: 25/04/2026
-- 
-- CONTEXTO: A tabela 'transactions' agora usa INSERT ao invés de UPSERT.
-- Cada ação do funil (checkout_visit, click_plan, click_generate_pix, 
-- payment_approved) cria uma NOVA LINHA no banco, permitindo histórico 
-- completo de cada lead no dashboard.
--
-- A constraint UNIQUE em client_id impede esse modelo. Removemos ela.
-- O webhook-pix.js continua atualizando por pushinpay_id (que é único).
-- =========================================================================

-- 1. Remover constraint UNIQUE de client_id (permite múltiplas linhas por lead)
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_client_id_key;

-- 2. Manter o índice para performance de queries (não é unique, apenas index)
-- O índice idx_transactions_client_id_status já existe da migration v10
-- e não precisa ser recriado (ele não é UNIQUE, é apenas um B-tree index)

-- 3. Adicionar índice por created_at para ordenação rápida no dashboard
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions (created_at DESC);

-- ✅ Pronto! Execute este script no SQL Editor do Supabase Dashboard.
-- DEPOIS disso, faça o deploy do código no Vercel.
