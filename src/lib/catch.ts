/**
 * Catch probability engine.
 *
 * Based on a simplified version of the Gen 3+ catch formula:
 *   catchValue = (3 * maxHp - 2 * currentHp) / (3 * maxHp) * catchRate * ballModifier * areaModifier
 *   probability = catchValue / 255
 *
 * Clamped to [MIN_CATCH_RATE, MAX_CATCH_RATE] to keep the game fun for kids.
 */

import type { Area } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Base catch rates by species rarity (approximated from Gen 1 data). */
const BASE_CATCH_RATE_BY_LEVEL: Record<string, number> = {
  common: 190,   // e.g. Pidgey, Rattata
  uncommon: 120, // e.g. Meowth
  rare: 45,      // e.g. Abra
};

/** Minimum catch probability so the game never feels completely hopeless. */
const MIN_CATCH_RATE = 0.05;
/** Maximum catch probability — keeps the game interesting, never a guaranteed catch. */
const MAX_CATCH_RATE = 0.95;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CatchAttemptResult {
  success: boolean;
  probability: number;
  /** Shake count (0–3) for animation — 3 shakes then break = near miss */
  shakes: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Map a Pokemon's level to a rough rarity tier. */
function rarityTier(pokemonId: number): keyof typeof BASE_CATCH_RATE_BY_LEVEL {
  // Rare singles (starters, pseudo-legendaries, etc.)
  const rare = [63, 64, 65, 35, 39, 147, 148, 149];
  if (rare.includes(pokemonId)) return "rare";
  // Uncommon
  const uncommon = [52, 53, 23, 24, 37, 38, 41, 42];
  if (uncommon.includes(pokemonId)) return "uncommon";
  return "common";
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Attempt to catch a wild Pokemon.
 *
 * @param pokemonId    - Species Pokedex ID
 * @param currentHp    - Wild Pokemon's current HP
 * @param maxHp        - Wild Pokemon's max HP
 * @param area         - Area where the encounter is happening
 * @param ballModifier - 1 for standard Pokeball, 1.5 for Great Ball (future)
 */
export function attemptCatch(
  pokemonId: number,
  currentHp: number,
  maxHp: number,
  area: Area,
  ballModifier = 1
): CatchAttemptResult {
  const catchRate = BASE_CATCH_RATE_BY_LEVEL[rarityTier(pokemonId)];

  // HP modifier: lower HP = higher catch chance
  const hpModifier = (3 * maxHp - 2 * currentHp) / (3 * maxHp);

  const rawProbability =
    (hpModifier * catchRate * ballModifier * area.catchRateModifier) / 255;

  const probability = Math.min(MAX_CATCH_RATE, Math.max(MIN_CATCH_RATE, rawProbability));

  const success = Math.random() < probability;

  // Shake count: 0–3 based on probability (for animation)
  const shakeThreshold = probability;
  const shakes = success
    ? 3
    : Math.floor(shakeThreshold / (1 / 4)); // 0–2 shakes on failure

  return { success, probability, shakes: Math.min(shakes, success ? 3 : 2) };
}

/**
 * Pick a random wild Pokemon ID from an area's available pool.
 * If the pool is empty, fall back to any Gen 1 Pokemon.
 */
export function pickWildPokemonId(area: Area): number {
  const pool = area.availablePokemonIds.length > 0
    ? area.availablePokemonIds
    : Array.from({ length: 151 }, (_, i) => i + 1);
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Pick a random level for a wild Pokemon within an area's level range.
 */
export function pickWildLevel(area: Area): number {
  const [min, max] = area.levelRange;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
