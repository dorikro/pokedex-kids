import {
  Pokemon,
  PokemonSpecies,
  EvolutionChain,
  EvolutionStep,
  EvolutionChainLink,
  AbilityDetail,
  PokemonCardData,
} from "./types";

const BASE_URL = "https://pokeapi.co/api/v2";

// Simple in-memory cache
const cache = new Map<string, unknown>();

async function fetchWithCache<T>(url: string): Promise<T> {
  if (cache.has(url)) {
    return cache.get(url) as T;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  const data = await response.json();
  cache.set(url, data);
  return data as T;
}

// Fetch a single Pokemon by ID or name
export async function fetchPokemon(idOrName: string | number): Promise<Pokemon> {
  return fetchWithCache<Pokemon>(`${BASE_URL}/pokemon/${idOrName}`);
}

// Fetch Pokemon species data (for flavor text, generation, evolution chain URL)
export async function fetchPokemonSpecies(idOrName: string | number): Promise<PokemonSpecies> {
  return fetchWithCache<PokemonSpecies>(`${BASE_URL}/pokemon-species/${idOrName}`);
}

// Fetch evolution chain
export async function fetchEvolutionChain(url: string): Promise<EvolutionChain> {
  return fetchWithCache<EvolutionChain>(url);
}

// Fetch ability details
export async function fetchAbilityDetail(url: string): Promise<AbilityDetail> {
  return fetchWithCache<AbilityDetail>(url);
}

// Get a batch of Pokemon card data for a range of IDs
export async function fetchPokemonBatch(
  ids: number[]
): Promise<PokemonCardData[]> {
  const promises = ids.map(async (id) => {
    try {
      const pokemon = await fetchPokemon(id);
      return {
        id: pokemon.id,
        name: pokemon.name,
        sprite: pokemon.sprites.front_default,
        types: pokemon.types.map((t) => t.type.name),
      };
    } catch {
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((r): r is PokemonCardData => r !== null);
}

// Parse evolution chain into flat steps
function flattenEvolutionChain(chain: EvolutionChainLink): string[] {
  const names: string[] = [chain.species.name];
  for (const next of chain.evolves_to) {
    names.push(...flattenEvolutionChain(next));
  }
  return names;
}

export async function getEvolutionSteps(
  evolutionChainUrl: string
): Promise<EvolutionStep[]> {
  const chain = await fetchEvolutionChain(evolutionChainUrl);
  const names = flattenEvolutionChain(chain.chain);

  const steps: EvolutionStep[] = [];
  for (const name of names) {
    try {
      const pokemon = await fetchPokemon(name);
      steps.push({
        name: pokemon.name,
        id: pokemon.id,
        sprite: pokemon.sprites.front_default,
      });
    } catch {
      steps.push({
        name,
        id: 0,
        sprite: null,
      });
    }
  }

  return steps;
}

// Get English flavor text
export function getEnglishFlavorText(species: PokemonSpecies): string {
  const entry = species.flavor_text_entries.find(
    (e) => e.language.name === "en"
  );
  if (!entry) return "No description available.";
  // Clean up whitespace/newlines in flavor text
  return entry.flavor_text.replace(/[\n\f\r]/g, " ").replace(/\s+/g, " ").trim();
}

// Get English ability description
export function getEnglishAbilityDescription(ability: AbilityDetail): string {
  const effect = ability.effect_entries.find((e) => e.language.name === "en");
  if (effect) return effect.short_effect;
  const flavor = ability.flavor_text_entries.find(
    (e) => e.language.name === "en"
  );
  if (flavor) return flavor.flavor_text;
  return "No description available.";
}

// Format Pokemon name for display
export function formatPokemonName(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// Format stat name for display
export function formatStatName(name: string): string {
  const map: Record<string, string> = {
    hp: "HP",
    attack: "Attack",
    defense: "Defense",
    "special-attack": "Sp. Atk",
    "special-defense": "Sp. Def",
    speed: "Speed",
  };
  return map[name] || name;
}

// Format height (decimeters to feet/inches or meters)
export function formatHeight(decimeters: number): string {
  const meters = decimeters / 10;
  const feet = Math.floor(meters * 3.28084);
  const inches = Math.round((meters * 3.28084 - feet) * 12);
  return `${feet}'${inches.toString().padStart(2, "0")}" (${meters.toFixed(1)} m)`;
}

// Format weight (hectograms to lbs or kg)
export function formatWeight(hectograms: number): string {
  const kg = hectograms / 10;
  const lbs = (kg * 2.20462).toFixed(1);
  return `${lbs} lbs (${kg.toFixed(1)} kg)`;
}

// Speak a Pokemon name using Web Speech API
export function speakPokemonName(name: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(formatPokemonName(name));
  utterance.rate = 0.9;
  utterance.pitch = 1.1;
  window.speechSynthesis.speak(utterance);
}
