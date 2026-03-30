# Pokedex Kids

A kid-friendly Pokemon encyclopedia built with Next.js. Browse, search, and filter all 1,025 Pokemon across 9 generations, view detailed stats and evolution chains, hear Pokemon names spoken aloud, and simulate type-based battles.

**Live:** [demo-pokedex-bgcnbxc9gbc2eady.swedencentral-01.azurewebsites.net](https://demo-pokedex-bgcnbxc9gbc2eady.swedencentral-01.azurewebsites.net)

## Features

### Browse & Search

- Responsive grid of Pokemon cards with sprites, names, and type badges
- Search by name or Pokedex number
- Filter by generation (Gen I through Gen IX)
- Filter by type (18 types, multi-select)
- Infinite scroll with "Load More" fallback

### Pokemon Detail Pages

- Sprite, official artwork, and type badges
- Base stats with color-coded horizontal bars (HP, Attack, Defense, Sp. Atk, Sp. Def, Speed)
- Abilities with descriptions (hidden abilities flagged)
- Evolution chain with clickable sprites
- Pokedex flavor text entry
- Height and weight in both metric and imperial
- **Speak button** -- uses the Web Speech API to pronounce the Pokemon's name out loud

### Battle Simulator

- Pick two Pokemon and press "Fight!"
- Battle logic uses the full 18x18 type effectiveness chart from the games
- Considers base stat totals combined with type multipliers
- Close matches (within 5%) are declared a tie
- Generates a kid-friendly explanation of why the winner won

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19 |
| Styling | Tailwind CSS 4 |
| Data | Pre-seeded JSON from PokeAPI v2 |
| Deployment | Azure App Service (Linux) |
| CI/CD | GitHub Actions |

Zero external API calls at runtime. The entire Pokemon dataset is pre-seeded into a local JSON file and served through the app's own API routes.

## Architecture

```
src/
  app/
    page.tsx                  # Home -- browse/search/filter grid
    pokemon/[id]/page.tsx     # Pokemon detail page
    battle/page.tsx           # Battle simulator
    about/page.tsx            # About page (renders this README)
    api/pokemon/
      route.ts                # GET /api/pokemon -- paginated list with filters
      [id]/route.ts           # GET /api/pokemon/:id -- single Pokemon detail
  components/
    Navbar.tsx                # Sticky nav bar
    PokemonCard.tsx           # Grid card
    PokemonDetail.tsx         # Full detail view
    SearchBox.tsx             # Search input with "/" shortcut
    GenerationTabs.tsx        # Gen I-IX filter tabs
    TypeFilter.tsx            # 18-type toggle filter
    TypeBadge.tsx             # Color-coded type pill
    StatChart.tsx             # Horizontal stat bars
    SpeakButton.tsx           # Text-to-speech button
  lib/
    pokemon-db.ts             # Server-side data layer (loads JSON, query/filter)
    api-client.ts             # Client-side fetch helpers + formatters
    battle.ts                 # Battle calculation engine
    types.ts                  # TypeScript interfaces
    constants.ts              # Type colors, gen ranges, effectiveness chart
data/
  pokemon.json                # All 1,025 Pokemon (~1.2 MB)
scripts/
  seed.mjs                    # One-time PokeAPI data fetcher
.github/workflows/
  deploy.yml                  # CI/CD pipeline
```

### Data Flow

1. **Seed** (one-time): `scripts/seed.mjs` fetches all Pokemon from PokeAPI v2 in batches, flattens each into a `LocalPokemon` record, and writes to `data/pokemon.json`.
2. **Server**: `pokemon-db.ts` loads the JSON into memory on first request and builds lookup maps by ID and name. API routes call `queryPokemon()` and `getPokemon()`.
3. **Client**: Pages use `api-client.ts` to call `/api/pokemon` and `/api/pokemon/:id`. No direct PokeAPI calls.

## Getting Started

### Prerequisites

- Node.js 24+
- npm

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seed Pokemon Data

The repository already includes `data/pokemon.json`. To re-seed from PokeAPI:

```bash
npm run seed
```

This fetches all 1,025 Pokemon and writes to `data/pokemon.json`. Takes a few minutes (rate-limited to be polite to PokeAPI).

### Build for Production

```bash
npm run build
```

The app builds as a standalone Node.js server. To run the production build locally:

```bash
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
cp -r data .next/standalone/
node .next/standalone/server.js
```

## Deployment

The app deploys to Azure App Service (Linux, Node.js 24) via GitHub Actions on every push to `main`.

### CI/CD Pipeline

The workflow in `.github/workflows/deploy.yml`:

1. Checks out code
2. Installs dependencies (`npm ci`)
3. Builds the Next.js app (`npm run build`)
4. Packages standalone output with static assets and data into a zip
5. Authenticates to Azure via OIDC (federated identity)
6. Deploys the zip to Azure App Service
7. Sets the startup command (`node server.js`)

### Security

- GitHub Actions pinned to SHA hashes
- Minimal workflow permissions (`id-token: write`, `contents: read`)
- Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- API input validation with capped limit (max 100 per request)

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run seed` | Re-fetch all Pokemon data from PokeAPI |

## Credits

- Pokemon data from [PokeAPI](https://pokeapi.co/)
- Pokemon sprites and artwork from [PokeAPI/sprites](https://github.com/PokeAPI/sprites)
- Built with [Next.js](https://nextjs.org/), [React](https://react.dev/), and [Tailwind CSS](https://tailwindcss.com/)
