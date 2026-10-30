# ⚽ Termin 5 na 5 • Zeleni vs Šareni

Web aplikacija za dugoročno praćenje rezultata, strijelaca, MVP priznanja i statistike igrača termina malog nogometa koji se igra svakog utorka.

Dizajnirana za rad na mobitelima i računalima, s cloud bazom (Supabase) i automatskim objavljivanjem na Netlifyju.

---

## 🌟 Funkcionalnosti

- **Pregled (Dashboard):**
  - Veliki semafor zadnjeg odigranog utorka (Zeleni vs Šareni)
  - Prikaz strijelaca i proglašenog MVP-a
  - Brzi pregled lidera: *Zlatna kopačka* (najbolji strijelac), *MVP Vladar* i *Talisman pobjeda* (najveći % pobjeda)
- **Ljestvica Strijelaca & Statistika:**
  - Filtriranje po sezonama (ili sveukupna povijest kroz godine)
  - Sortiranje po broju golova, MVP titulama ili postotku pobjeda
  - Prikaz pobjeda, remija, poraza (P-N-I) i prosjeka golova po utakmici
  - Postolje za top 3 igrača (🥇 🥈 🥉)
- **Arhiva Utakmica:**
  - Pregled svih odigranih termina po datumima
  - Detaljan prikaz sastava i tko je zabio za koju ekipu
- **Unos Utakmice (Admin):**
  - Zaštićeno jednostavnim PIN-om (zadano: `1234`, promjenjivo u postavkama)
  - Odabir datuma i sezone
  - Brzi odabir igrača za Zelene i Šarene
  - Interaktivni brojač golova (`+` / `-`) uz automatsko zbrajanje rezultata
  - Odabir MVP igrača utakmice
  - Slavlje uz konfete animaciju prilikom unosa!
- **Upravljanje Igračima & Sezonama:**
  - Dodavanje novih igrača i nadimaka
  - Kreiranje novih sezona (npr. *Sezona 2026/2027*)
- **Sigurnost & Backup:**
  - Mogućnost preuzimanja cjelokupne arhive u JSON formatu (1-klik backup)

---

## 🚀 1. Postavljanje Baze (Supabase - 2 minute)

Aplikacija koristi **Supabase** (besplatan PostgreSQL cloud servis koji bez problema drži godine i desetljeća ovakvih termina):

1. Otvorite [supabase.com](https://supabase.com) i kreirajte besplatan račun.
2. Kliknite **"New Project"**, upišite npr. `Termin 5na5` i odaberite regiju (npr. Frankfurt / Central EU).
3. Kad se projekt kreira, u lijevom izborniku kliknite na **SQL Editor**.
4. Otvorite datoteku `supabase-schema.sql` iz ovog repozitorija, kopirajte sav tekst, zalijepite u Supabase SQL Editor i kliknite **Run**.
5. Idite u **Project Settings** (ikona zupčanika dolje lijevo) → **API** i kopirajte:
   - **Project URL**
   - **anon / public key**

> **Napomena:** Ako još niste postavili Supabase, aplikacija automatski radi u lokalnom načinu rada (Demo) sa spremanjem u memoriju preglednika, a podatke baze možete u bilo kojem trenutku unijeti direktno kroz sučelje aplikacije (**Postavke → Supabase Baza**)!

---

## 🌐 2. Objava na Netlify (Besplatno)

### Opcija A: Povezivanje preko GitHuba (Automatski update na svaki push)
1. Napravite repozitorij na svom GitHub računu (npr. `termin-tracker`).
2. Povežite lokalni kod i pushajte:
   ```bash
   git init
   git add .
   git commit -m "Inicijalna verzija aplikacije"
   git branch -M main
   git remote add origin https://github.com/<vas-korisnik>/termin-tracker.git
   git push -u origin main
   ```
3. Prijavite se na [netlify.com](https://www.netlify.com).
4. Kliknite **"Add new site" → "Import an existing project" → "GitHub"**.
5. Odaberite repozitorij `termin-tracker`.
6. U polje **Environment variables** dodajte:
   - `VITE_SUPABASE_URL` = (vaš Supabase URL)
   - `VITE_SUPABASE_ANON_KEY` = (vaš Supabase anon key)
7. Kliknite **"Deploy site"** i u roku od minute vaša stranica je aktivna na adresi poput `termin-5na5.netlify.app`!

### Opcija B: Netlify Drop (Bez Gita - Drag & Drop)
1. U mapi projekta pokrenite:
   ```bash
   npm run build
   ```
2. Na [app.netlify.com/drop](https://app.netlify.com/drop) samo dovučete mapu `dist` u preglednik.
3. Stranica je odmah online! U postavkama aplikacije na samoj stranici kliknite na zupčanik (Postavke) i unesite Supabase URL i ključ.

---

## 💻 Lokalno pokretanje (za razvoj)

```bash
# Instalacija paketa
npm install

# Pokretanje lokalnog razvojnog poslužitelja
npm run dev

# Izrada produkcijskog builda
npm run build
```
