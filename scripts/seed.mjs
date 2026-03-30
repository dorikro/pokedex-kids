/**
 * Seed script: Fetches all 1025 Pokemon from PokeAPI and saves to data/pokemon.json
 *
 * Run once with: node scripts/seed.mjs
 *
 * This avoids hitting PokeAPI at runtime — all data is served from the local JSON file.
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = "https://pokeapi.co/api/v2";
const TOTAL_POKEMON = 1025;
const CONCURRENCY = 10; // parallel requests to be polite to PokeAPI

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

function getEnglishFlavorText(species) {
  const entry = species.flavor_text_entries.find(
    (e) => e.language.name === "en"
  );
  if (!entry) return "";
  return entry.flavor_text.replace(/[\n\f\r]/g, " ").replace(/\s+/g, " ").trim();
}

function getEnglishAbilityDescription(ability) {
  const effect = ability.effect_entries.find((e) => e.language.name === "en");
  if (effect) return effect.short_effect;
  const flavor = ability.flavor_text_entries.find(
    (e) => e.language.name === "en"
  );
  if (flavor) return flavor.flavor_text;
  return "";
}

function flattenEvolutionChain(chain) {
  const names = [chain.species.name];
  for (const next of chain.evolves_to) {
    names.push(...flattenEvolutionChain(next));
  }
  return names;
}

// Process Pokemon in batches to avoid overwhelming PokeAPI
async function processBatch(ids) {
  return Promise.all(ids.map(async (id) => {
    try {
      // Fetch core Pokemon data
      const pokemon = await fetchJson(`${BASE_URL}/pokemon/${id}`);

      // Fetch species data
      const species = await fetchJson(`${BASE_URL}/pokemon-species/${id}`);

      // Fetch ability descriptions
      const abilities = await Promise.all(
        pokemon.abilities.map(async (a) => {
          try {
            const detail = await fetchJson(a.ability.url);
            return {
              name: a.ability.name,
              is_hidden: a.is_hidden,
              description: getEnglishAbilityDescription(detail),
            };
          } catch {
            return {
              name: a.ability.name,
              is_hidden: a.is_hidden,
              description: "",
            };
          }
        })
      );

      // Fetch evolution chain
      let evolutionSteps = [];
      if (species.evolution_chain?.url) {
        try {
          const evoChain = await fetchJson(species.evolution_chain.url);
          const names = flattenEvolutionChain(evoChain.chain);

          // Fetch sprite for each evolution step
          evolutionSteps = await Promise.all(
            names.map(async (name) => {
              try {
                const p = await fetchJson(`${BASE_URL}/pokemon/${name}`);
                return {
                  name: p.name,
                  id: p.id,
                  sprite: p.sprites.front_default,
                };
              } catch {
                return { name, id: 0, sprite: null };
              }
            })
          );
        } catch {
          // Evolution chain fetch failed, leave empty
        }
      }

      return {
        id: pokemon.id,
        name: pokemon.name,
        height: pokemon.height,
        weight: pokemon.weight,
        types: pokemon.types.map((t) => t.type.name),
        stats: pokemon.stats.map((s) => ({
          name: s.stat.name,
          base_stat: s.base_stat,
        })),
        abilities,
        sprite: pokemon.sprites.front_default,
        artwork:
          pokemon.sprites.other?.["official-artwork"]?.front_default || null,
        flavor_text: getEnglishFlavorText(species),
        generation: species.generation.name,
        evolution_chain: evolutionSteps,
      };
    } catch (err) {
      console.error(`  Failed to fetch Pokemon #${id}: ${err.message}`);
      return null;
    }
  }));
}

async function main() {
  console.log(`Fetching ${TOTAL_POKEMON} Pokemon from PokeAPI...`);
  console.log(`Concurrency: ${CONCURRENCY} at a time\n`);

  const allPokemon = [];
  const allIds = Array.from({ length: TOTAL_POKEMON }, (_, i) => i + 1);

  for (let i = 0; i < allIds.length; i += CONCURRENCY) {
    const batch = allIds.slice(i, i + CONCURRENCY);
    const batchNum = Math.floor(i / CONCURRENCY) + 1;
    const totalBatches = Math.ceil(allIds.length / CONCURRENCY);

    console.log(
      `Batch ${batchNum}/${totalBatches}: Pokemon #${batch[0]}-#${batch[batch.length - 1]}...`
    );

    const results = await processBatch(batch);
    allPokemon.push(...results.filter((r) => r !== null));

    // Small delay between batches to be kind to the API
    if (i + CONCURRENCY < allIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  // Sort by ID
  allPokemon.sort((a, b) => a.id - b.id);

  const outputPath = join(__dirname, "..", "data", "pokemon.json");
  writeFileSync(outputPath, JSON.stringify(allPokemon, null, 2));

  console.log(`\nDone! Saved ${allPokemon.length} Pokemon to ${outputPath}`);
  const stats = {
    total: allPokemon.length,
    withEvolution: allPokemon.filter((p) => p.evolution_chain.length > 1).length,
    withArtwork: allPokemon.filter((p) => p.artwork).length,
    withFlavorText: allPokemon.filter((p) => p.flavor_text).length,
    fileSizeMB: (
      Buffer.byteLength(JSON.stringify(allPokemon)) /
      1024 /
      1024
    ).toFixed(2),
  };
  console.log("\nStats:", stats);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
