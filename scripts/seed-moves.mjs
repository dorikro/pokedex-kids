/**
 * Seed script: Fetches moves for the first 151 Pokemon (Gen 1) from PokeAPI
 * and saves a curated move set per Pokemon to data/moves.json.
 *
 * Run once with: node scripts/seed-moves.mjs
 *
 * Strategy:
 *  - For each Gen 1 Pokemon, pull all level-up moves
 *  - Keep only damaging moves (power > 0) that the Pokemon can learn by level 60
 *  - Pick up to 4 moves, prioritising variety of types and higher power
 *  - Also build a flat moves dictionary keyed by move ID for runtime lookups
 *
 * Output shape:
 *  {
 *    byPokemon: { [pokemonId: number]: SeedMove[] }  // up to 4 per Pokemon
 *    byId:      { [moveId: number]: SeedMove }       // flat lookup
 *  }
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = "https://pokeapi.co/api/v2";
const GEN1_COUNT = 151;
const CONCURRENCY = 8;

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json();
}

// ─── Move normalisation ───────────────────────────────────────────────────────

function normaliseMove(moveDetail, learnLevel) {
  const englishName = moveDetail.names?.find((n) => n.language.name === "en")?.name
    ?? moveDetail.name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    id: moveDetail.id,
    name: englishName,
    slug: moveDetail.name,
    type: moveDetail.type.name,
    power: moveDetail.power,           // null for status moves
    pp: moveDetail.pp,
    accuracy: moveDetail.accuracy,     // null = always hits
    damageClass: moveDetail.damage_class.name, // "physical" | "special" | "status"
    learnLevel,                        // level at which this Pokemon learns it
  };
}

// ─── Pick best 4 moves for a Pokemon ─────────────────────────────────────────

function pickBestMoves(allMoves) {
  // Only keep damaging moves learnable by level 60
  const damaging = allMoves
    .filter((m) => m.power !== null && m.power > 0 && m.learnLevel <= 60)
    .sort((a, b) => b.power - a.power);

  if (damaging.length === 0) return allMoves.slice(0, 4);

  const selected = [];
  const usedTypes = new Set();

  // First pass: one move per type, highest power
  for (const move of damaging) {
    if (!usedTypes.has(move.type)) {
      selected.push(move);
      usedTypes.add(move.type);
    }
    if (selected.length >= 4) break;
  }

  // Second pass: fill remaining slots with highest-power moves
  if (selected.length < 4) {
    for (const move of damaging) {
      if (!selected.includes(move)) {
        selected.push(move);
      }
      if (selected.length >= 4) break;
    }
  }

  return selected.slice(0, 4);
}

// ─── Process one Pokemon ──────────────────────────────────────────────────────

async function processPokemon(id) {
  const pokemon = await fetchJson(`${BASE_URL}/pokemon/${id}`);

  // Collect level-up moves with their learn levels
  const levelUpMoves = pokemon.moves
    .flatMap((m) =>
      m.version_group_details
        .filter((vgd) => vgd.move_learn_method.name === "level-up")
        .map((vgd) => ({ url: m.move.url, learnLevel: vgd.level_learned_at }))
    )
    // deduplicate by url, keep lowest learn level
    .reduce((acc, { url, learnLevel }) => {
      const existing = acc.find((x) => x.url === url);
      if (existing) {
        existing.learnLevel = Math.min(existing.learnLevel, learnLevel);
      } else {
        acc.push({ url, learnLevel });
      }
      return acc;
    }, []);

  if (levelUpMoves.length === 0) return { id, moves: [] };

  // Fetch move details (with concurrency limit)
  const moveDetails = [];
  for (let i = 0; i < levelUpMoves.length; i += CONCURRENCY) {
    const batch = levelUpMoves.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(({ url, learnLevel }) =>
        fetchJson(url).then((detail) => normaliseMove(detail, learnLevel))
      )
    );
    for (const r of results) {
      if (r.status === "fulfilled") moveDetails.push(r.value);
    }
  }

  const best4 = pickBestMoves(moveDetails);
  return { id, moves: best4, allMoves: moveDetails };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Seeding moves for Gen 1 (${GEN1_COUNT} Pokémon)...`);

  const byPokemon = {};
  const byId = {};

  const ids = Array.from({ length: GEN1_COUNT }, (_, i) => i + 1);
  let done = 0;

  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const batch = ids.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(processPokemon));

    for (const result of results) {
      if (result.status === "fulfilled") {
        const { id, moves, allMoves = [] } = result.value;
        byPokemon[id] = moves;
        for (const move of allMoves) {
          byId[move.id] = move;
        }
        done++;
        process.stdout.write(`\r  Progress: ${done}/${GEN1_COUNT}`);
      } else {
        console.error(`\n  Failed:`, result.reason?.message);
      }
    }
  }

  console.log(`\nDone! Saving...`);

  mkdirSync(join(__dirname, "../data"), { recursive: true });
  const outPath = join(__dirname, "../data/moves.json");
  writeFileSync(
    outPath,
    JSON.stringify({ byPokemon, byId }, null, 2),
    "utf-8"
  );

  const pokemonCount = Object.keys(byPokemon).length;
  const moveCount = Object.keys(byId).length;
  console.log(`Saved ${pokemonCount} Pokémon move sets, ${moveCount} unique moves → ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
