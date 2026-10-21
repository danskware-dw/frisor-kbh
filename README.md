# FRISØR KBH

Dette er den officielle website for FRISØR KBH, en moderne herrefrisør i København.
Websitet er bygget med Next.js, Tailwind CSS og TypeScript for at sikre høj performance, stærk SEO, og en premium brugeroplevelse.

## Teknologistak
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS + custom CSS variables
- **Sprog:** TypeScript
- **Ikoner:** Lucide React
- **SEO:** Statisk generering (SSG), JSON-LD strukturerede data

## Installation
Sørg for at have Node.js (version 18 eller nyere) installeret.

```bash
# Installer afhængigheder
npm install
```

## Lokal Udvikling
Start den lokale udviklingsserver:

```bash
npm run dev
```
Websitet kan nu tilgås på [http://localhost:3000](http://localhost:3000).

## Produktion Build
For at bygge applikationen til produktion:

```bash
npm run build
npm start
```

## Lukkedage

Administratorer kan oprette lukkedage direkte på dashboardet under **Lukkedage**. Vælg en dato, tilføj eventuelt en besked til kunderne, og tryk **Gem lukkedag**. **Rediger besked** ændrer teksten for den valgte dag. **Fjern lukkedag** lader datoen følge de normale åbningstider igen.

Lukkedage vises på forsiden og bookingsiden og blokerer nye bookinger for alle medarbejdere og behandlinger. Andre åbningsdage kan stadig bookes. Eksisterende bookinger vises som en advarsel på dashboardet og aflyses ikke automatisk. Datoerne følger dansk tid (`Europe/Copenhagen`). En åben bookingside opdaterer lukkedage ved fokus og hvert minut; serveren kontrollerer altid datoen ved booking.

Kør SQL-filen `drizzle/0003_salon_closures.sql` én gang i hvert databasemiljø, før denne version sættes i drift. Den opretter tabellen med RLS og begrænser adgang til serveren.

### Test af booking og lukkedage

```bash
npm test
```

Testene bruger `TEST_DATABASE_URL` eller `DATABASE_URL` fra `.env.local`. De opretter et separat, midlertidigt databaseskema og fjerner det bagefter. Eksisterende kunder og bookinger ændres ikke, og der sendes ingen e-mails. Databasebrugeren skal kunne oprette skemaer; testmiljøet skal have Supabase-rollerne `anon` og `authenticated`.

## Projektstruktur
- `src/app/` - Next.js App Router (sider, layouts, globale styles)
- `src/components/` - Genanvendelige UI komponenter (layout, sektioner, ui-elementer)
- `src/data/site.ts` - **Al redigerbar indhold og forretningsdata findes her!**
- `public/brand/` - Logoer og brand assets
- `public/images/` - Billeder til galleri, hero sektion osv.

## Sådan opdaterer du indhold

### Udskiftning af Logo
Placer det officielle logo i `public/brand/`:
- `frisor-kbh-wordmark.svg` (bruges i header)
- `frisor-kbh-logo.png` (bruges til SEO/deling)
*Sørg for, at filerne beholder samme navne for at undgå at ændre i koden.*

### Udskiftning af Billeder
- **Hero-billede:** Overskriv `public/images/hero.webp`
- **Om os-billede:** Overskriv `public/images/about.webp`
- **Galleri:** Læg billeder i `public/images/gallery/` mappen (navngivet `1.webp`, `2.webp` osv.)

### Redigering af Virksomhedsinformation (Adresse, Priser, Åbningstider osv.)
Alt indhold kan nemt redigeres uden at røre ved selve komponenterne. Åbn `src/data/site.ts`.

Her kan du blandt andet rette:
- `contact.phone` og `contact.email`
- `contact.bookingUrl`
- `openingHours` listen
- `services` listen (tilføj, fjern eller rediger priser)

## Deployment til Vercel
Dette projekt er optimeret til lynhurtig deployment på Vercel:
1. Push koden til GitHub.
2. Opret et nyt projekt i Vercel og importer repository'et.
3. Vercel opdager automatisk Next.js og opsætter de rigtige build-kommandoer (`npm run build`).
4. Klik på "Deploy".

### Bookingbekræftelser med Resend

Når en booking er oprettet, sender systemet automatisk en bekræftelse til kunden og en ny booking-notifikation til salonen. Tilføj disse miljøvariabler lokalt og i Vercel:

```bash
RESEND_API_KEY="re_..."
EMAIL_FROM="FRISØR KBH <booking@frisorkbh.dk>"
EMAIL_REPLY_TO="frisorkbh@hotmail.com"
BOOKING_NOTIFICATION_EMAIL="kbhfrisor@gmail.com"
```

Domænet i `EMAIL_FROM` skal være verificeret i Resend. `EMAIL_REPLY_TO` er den adresse, kundens svar sendes til. `BOOKING_NOTIFICATION_EMAIL` er den adresse, der modtager besked om nye bookinger.
