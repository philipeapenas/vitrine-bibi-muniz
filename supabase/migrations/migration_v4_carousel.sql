-- migration_v4_carousel.sql

CREATE TABLE IF NOT EXISTS public.carousel_photos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    storage_path text NOT NULL,
    public_url text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- RLS
ALTER TABLE public.carousel_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso publico para selecao" ON public.carousel_photos FOR SELECT USING (true);

-- Gatilho para auto-update do updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIaGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_carousel_photos_updated_at
    BEFORE UPDATE ON public.carousel_photos
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
