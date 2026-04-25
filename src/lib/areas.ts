/**
 * Area definitions — v0.2.0 ships with a single area.
 *
 * Architecture note: this file is the single source of truth for world areas.
 * In v0.3 we'll add a map UI and more areas here; the rest of the game logic
 * (wild encounters, catch system) already reads from this structure so no
 * refactoring will be needed.
 */

import type { Area } from "./types";

// ─── Area definitions ─────────────────────────────────────────────────────────

export const AREAS: Area[] = [
  {
    id: "pallet-town",
    name: "Pallet Town",
    levelRange: [2, 10],
    // Gen 1 common early-route Pokemon (Routes 1 & 2 equivalents)
    availablePokemonIds: [
      16, 17,  // Pidgey, Pidgeotto
      19, 20,  // Rattata, Raticate
      10, 11, 12, // Caterpie, Metapod, Butterfree
      13, 14, 15, // Weedle, Kakuna, Beedrill
      35,      // Clefairy (rare)
      39,      // Jigglypuff (rare)
      52,      // Meowth
      63,      // Abra (rare)
    ],
    requiredBadges: 0,
    catchRateModifier: 1,
  },
  // ── Future areas (unlock via map in v0.3) ────────────────────────────────
  // {
  //   id: "viridian-forest",
  //   name: "Viridian Forest",
  //   levelRange: [3, 14],
  //   availablePokemonIds: [10, 11, 12, 13, 14, 15, 25, 26],
  //   requiredBadges: 0,
  //   catchRateModifier: 1,
  // },
  // {
  //   id: "mt-moon",
  //   name: "Mt. Moon",
  //   levelRange: [8, 20],
  //   availablePokemonIds: [35, 39, 41, 42, 46, 47, 74, 75],
  //   requiredBadges: 1,
  //   catchRateModifier: 0.85,
  // },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Look up an area by ID. Throws if not found (programmer error). */
export function getArea(areaId: string): Area {
  const area = AREAS.find((a) => a.id === areaId);
  if (!area) throw new Error(`Unknown area: ${areaId}`);
  return area;
}

/** Return areas available to a player with the given badge count. */
export function getUnlockedAreas(badges: number): Area[] {
  return AREAS.filter((a) => a.requiredBadges <= badges);
}

/** Default starting area ID. */
export const DEFAULT_AREA_ID = "pallet-town";
