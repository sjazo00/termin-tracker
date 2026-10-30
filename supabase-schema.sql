-- ========================================================
-- TERMIN 5 NA 5 (ZELENI VS ŠARENI) - SUPABASE SCHEMA
-- Kopirajte cijeli ovaj sadržaj u Supabase -> SQL Editor i kliknite RUN
-- ========================================================

-- 1. SEASONS (Sezone)
CREATE TABLE IF NOT EXISTS public.seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PLAYERS (Igrači)
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    nickname TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. MATCHES (Utakmice)
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    zeleni_score INT NOT NULL DEFAULT 0,
    sareni_score INT NOT NULL DEFAULT 0,
    mvp_player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. MATCH_PLAYERS (Igrači na utakmici, tim i golovi)
CREATE TABLE IF NOT EXISTS public.match_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    team TEXT NOT NULL CHECK (team IN ('zeleni', 'sareni')),
    goals INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(match_id, player_id)
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLITIKE
-- Omogućuje čitanje svima i unos/izmjenu preko aplikacije
-- ========================================================

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;

-- Dozvole za čitanje (Svi mogu pregledavati)
CREATE POLICY "Public read seasons" ON public.seasons FOR SELECT USING (true);
CREATE POLICY "Public read players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Public read match_players" ON public.match_players FOR SELECT USING (true);

-- Dozvole za unos i izmjene (Aplikacija unosi rezultate)
CREATE POLICY "Public insert seasons" ON public.seasons FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update seasons" ON public.seasons FOR UPDATE USING (true);

CREATE POLICY "Public insert players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update players" ON public.players FOR UPDATE USING (true);

CREATE POLICY "Public insert matches" ON public.matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update matches" ON public.matches FOR UPDATE USING (true);
CREATE POLICY "Public delete matches" ON public.matches FOR DELETE USING (true);

CREATE POLICY "Public insert match_players" ON public.match_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update match_players" ON public.match_players FOR UPDATE USING (true);
CREATE POLICY "Public delete match_players" ON public.match_players FOR DELETE USING (true);

-- ========================================================
-- POČETNI PODACI (SEED DATA)
-- ========================================================

-- Dodavanje sezone
INSERT INTO public.seasons (name, is_current)
VALUES ('Sezona 2026', true)
ON CONFLICT DO NOTHING;

-- Dodavanje početnih igrača
INSERT INTO public.players (name, nickname, is_active) VALUES
    ('Ivan', 'Ico', true),
    ('Marko', 'Mare', true),
    ('Luka', 'Luki', true),
    ('Ante', 'Toni', true),
    ('Filip', 'Fićo', true),
    ('Petar', 'Pero', true),
    ('Josip', 'Jole', true),
    ('Matej', 'Matko', true),
    ('Tomislav', 'Tomo', true),
    ('Dino', 'Dina', true),
    ('Borna', 'Boki', true),
    ('Stipe', 'Stipe', true)
ON CONFLICT (name) DO NOTHING;
