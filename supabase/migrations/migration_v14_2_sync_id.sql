-- Migration V14.2: Sincronizar Sequência de ID (site_profile)
-- Resolve o erro "duplicate key value violates unique constraint site_profile_pkey"
-- Sincroniza o contador interno (sequence) com o maior ID existente na tabela.

SELECT setval(
    pg_get_serial_sequence('public.site_profile', 'id'), 
    (SELECT COALESCE(MAX(id), 1) FROM public.site_profile)
);
