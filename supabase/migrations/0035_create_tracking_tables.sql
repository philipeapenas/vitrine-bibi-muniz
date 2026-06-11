CREATE TABLE IF NOT EXISTS public.tracking_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    event_name text,
    event_data jsonb
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    pushinpay_id text,
    payer_name text,
    payer_email text,
    payer_cpf text,
    paid_at timestamptz
);
