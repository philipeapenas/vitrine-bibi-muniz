-- 1. Criação da tabela site_profile
CREATE TABLE IF NOT EXISTS public.site_profile (
    id smallint PRIMARY KEY CHECK (id = 1),
    creator_name text NOT NULL,
    creator_handle text NOT NULL,
    profile_picture_url text,
    banner_image_url text,
    bio_short text,
    bio_full text,
    instagram_url text,
    tiktok_url text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- RLS para site_profile: Aberta leitura (anon), Gravação apenas quem tem service role key
ALTER TABLE public.site_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura publica livre" ON public.site_profile FOR SELECT USING (true);
-- Não há policy de UPSERT/INSERT, então client anon bloqueado, mas a Service Role do admin bypassa RLS.

-- Insert Inicial (Substituindo o antigo config.js)
INSERT INTO public.site_profile (id, creator_name, creator_handle, profile_picture_url, banner_image_url, bio_short, bio_full, instagram_url, tiktok_url)
VALUES (
    1,
    'Bibi Muniz ✨',
    '@bibimunizz021',
    'assets/photos/profile.jpg',
    null,
    'Ei você… sim, você 😘 Sou a Bibi, sua pequena gigante sem censura ❤️🔥<br><br>Yesss I also talk ENGLISH 🙊<br><br>Nasci com alma doce, mente travessa e um corpo pequeno, mas feito para te fazer tremer 😏...',
    'Ei você… sim, você 😘 Sou a Bibi, sua pequena gigante sem censura ❤️🔥<br><br>Yesss I also talk ENGLISH 🙊<br><br>Nasci com alma doce, mente travessa e um corpo pequeno, mas feito para te fazer tremer 😏<br><br>Posso parecer tranquila por fora, mas acredite, sou puro fogo e sei muito bem como ficar nos seus pensamentos 💭<br><br>Entre no meu mundo e você não vai querer sair:<br><br>💕 Doce e picante: adoro brincar com esse equilíbrio que descontrola seus pensamentos e te deixa com gostinho de quero mais 😈🔥<br>💕 Sem filtros ou enrolação: aqui você vai ver meu lado mais íntimo, conteúdo explícito e real que você não pode perder 💌<br>💕 Adoro flertar, rir e ser o motivo do seu coração acelerar toda vez que me vê 🔥<br><br>✨ Assine e receba uma surpresa exclusiva só para os seus olhos 👀<br>✨ Ative a renovação (rebill) e você terá um vídeo especial todo mês 💦<br>✨ Me mande “SOU NOVO” quando entrar, para receber seu presente de boas-vindas 😘<br><br>Pronto para conhecer a mulher que combina doçura e puro desejo?<br><br>Chega mais, meu amor, que a história está só começando 💖',
    'https://www.instagram.com/bibimunizz021/',
    null
) ON CONFLICT (id) DO NOTHING;

-- 2. Criação da tabela site_offers
CREATE TABLE IF NOT EXISTS public.site_offers (
    id text PRIMARY KEY,
    name text NOT NULL,
    value_cents integer NOT NULL,
    url text NOT NULL,
    description text,
    is_promotion boolean DEFAULT false,
    discount_label text,
    active boolean DEFAULT true,
    button_color text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- RLS para site_offers
ALTER TABLE public.site_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura publica livre" ON public.site_offers FOR SELECT USING (true);

-- Instanciar as ofertas conhecidas atualmente
INSERT INTO public.site_offers (id, name, value_cents, url, description, is_promotion, discount_label, active, button_color)
VALUES 
    ('plan-ilimitado', 'Ilimitado', 2990, '#', 'Cobrado uma taxa única de', true, '70% off', true, null)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Bucket para Imagens (Usando Admin Dashboard Uploads)
INSERT INTO storage.buckets (id, name) VALUES ('site_assets', 'site_assets') ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Acesso público às imagens" ON storage.objects FOR SELECT TO public USING (bucket_id = 'site_assets');
-- Upload será feito apenas via Service Role Key
