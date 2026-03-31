import { PokemonCardData, LocalPokemon, PokemonListApiResponse } from "./types";

/**
 * Client-side API functions that call our own API routes instead of PokeAPI.
 */

export interface StatFilterParam {
  name: string;
  min?: number;
  max?: number;
}

/**
 * Fetch a paginated list of Pokemon with optional filters.
 */
export async function fetchPokemonList(options: {
  offset?: number;
  limit?: number;
  search?: string;
  types?: string[];
  generation?: number | null;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  statFilters?: StatFilterParam[];
  includeStats?: boolean;
}): Promise<PokemonListApiResponse> {
  const params = new URLSearchParams();

  if (options.offset) params.set("offset", String(options.offset));
  if (options.limit) params.set("limit", String(options.limit));
  if (options.search) params.set("search", options.search);
  if (options.types && options.types.length > 0) {
    params.set("types", options.types.join(","));
  }
  if (options.generation) params.set("generation", String(options.generation));
  if (options.sortBy) params.set("sortBy", options.sortBy);
  if (options.sortOrder) params.set("sortOrder", options.sortOrder);
  if (options.statFilters && options.statFilters.length > 0) {
    const encoded = options.statFilters
      .map((sf) => `${sf.name}:${sf.min ?? ""}:${sf.max ?? ""}`)
      .join(",");
    params.set("statFilter", encoded);
  }
  if (options.includeStats) params.set("includeStats", "1");

  const res = await fetch(`/api/pokemon?${params.toString()}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * Fetch full Pokemon detail by ID or name.
 */
export async function fetchPokemonDetail(
  idOrName: string | number
): Promise<LocalPokemon> {
  const res = await fetch(`/api/pokemon/${idOrName}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ─── Formatting helpers (keep client-side, no API needed) ──────────

export function formatPokemonName(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

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

export function formatHeight(decimeters: number): string {
  const meters = decimeters / 10;
  const feet = Math.floor(meters * 3.28084);
  const inches = Math.round((meters * 3.28084 - feet) * 12);
  return `${feet}'${inches.toString().padStart(2, "0")}" (${meters.toFixed(1)} m)`;
}

export function formatWeight(hectograms: number): string {
  const kg = hectograms / 10;
  const lbs = (kg * 2.20462).toFixed(1);
  return `${lbs} lbs (${kg.toFixed(1)} kg)`;
}

export function speakPokemonName(name: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(formatPokemonName(name));
  utterance.rate = 0.9;
  utterance.pitch = 1.1;
  window.speechSynthesis.speak(utterance);
}
