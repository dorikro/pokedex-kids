/**
 * Area definitions — v0.2.4
 *
 * Six areas, each harder than the last, unlocked by badge count.
 * The architecture (Area type, getArea, getUnlockedAreas) is unchanged —
 * the map UI in v0.3 will build on top of this data.
 */

import type { Area } from "./types";

export const AREAS: Area[] = [
  {
    id: "pallet-town",
    name: "Pallet Town",
    description: "Your home town. Gentle Pokémon roam the tall grass.",
    recommendedLevel: 5,
    levelRange: [2, 10],
    availablePokemonIds: [
      16, 17,        // Pidgey, Pidgeotto
      19, 20,        // Rattata, Raticate
      10, 11, 12,    // Caterpie → Butterfree
      13, 14, 15,    // Weedle → Beedrill
      35,            // Clefairy (rare)
      39,            // Jigglypuff (rare)
      52,            // Meowth
      63,            // Abra (rare)
    ],
    requiredBadges: 0,
    catchRateModifier: 1.0,
  },
  {
    id: "viridian-forest",
    name: "Viridian Forest",
    description: "A dense bug-filled forest. Watch out for Poison stings!",
    recommendedLevel: 10,
    levelRange: [5, 15],
    availablePokemonIds: [
      10, 11, 12,    // Caterpie → Butterfree
      13, 14, 15,    // Weedle → Beedrill
      25, 26,        // Pikachu, Raichu
      46, 47,        // Paras, Parasect
    ],
    requiredBadges: 0,
    catchRateModifier: 0.95,
  },
  {
    id: "mt-moon",
    name: "Mt. Moon",
    description: "A rocky cave full of Rock and Poison-type Pokémon.",
    recommendedLevel: 18,
    levelRange: [10, 22],
    availablePokemonIds: [
      35, 36,        // Clefairy, Clefable (rare)
      39, 40,        // Jigglypuff, Wigglytuff (rare)
      41, 42,        // Zubat, Golbat
      74, 75,        // Geodude, Graveler
      46, 47,        // Paras, Parasect
    ],
    requiredBadges: 1,
    catchRateModifier: 0.90,
  },
  {
    id: "cerulean-route",
    name: "Cerulean Route",
    description: "Open water routes near Cerulean City. Strong Water-types lurk here.",
    recommendedLevel: 28,
    levelRange: [18, 30],
    availablePokemonIds: [
      60, 61, 62,    // Poliwag → Poliwrath
      72, 73,        // Tentacool, Tentacruel
      116, 117,      // Horsea, Seadra
      54, 55,        // Psyduck, Golduck
      90, 91,        // Shellder, Cloyster (rare)
    ],
    requiredBadges: 2,
    catchRateModifier: 0.85,
  },
  {
    id: "rock-tunnel",
    name: "Rock Tunnel",
    description: "Pitch-dark tunnels. Ground and Fighting-types hit hard here.",
    recommendedLevel: 38,
    levelRange: [25, 40],
    availablePokemonIds: [
      66, 67, 68,    // Machop → Machamp
      74, 75, 76,    // Geodude → Golem
      95,            // Onix
      104, 105,      // Cubone, Marowak
      56, 57,        // Mankey, Primeape
    ],
    requiredBadges: 3,
    catchRateModifier: 0.80,
  },
  {
    id: "pokemon-tower",
    name: "Pokémon Tower",
    description: "A haunted tower. Ghost-types here will put your team to sleep!",
    recommendedLevel: 48,
    levelRange: [35, 50],
    availablePokemonIds: [
      92, 93, 94,    // Gastly → Gengar
      102, 103,      // Exeggcute, Exeggutor (Psychic)
      79, 80,        // Slowpoke, Slowbro
      108,           // Lickitung (rare)
      113,           // Chansey (rare)
    ],
    requiredBadges: 4,
    catchRateModifier: 0.75,
  },
];

/** Look up an area by ID. Falls back to pallet-town if not found. */
export function getArea(areaId: string): Area {
  return AREAS.find((a) => a.id === areaId) ?? AREAS[0];
}

/** Return areas unlocked for a player with the given badge count. */
export function getUnlockedAreas(badges: number): Area[] {
  return AREAS.filter((a) => a.requiredBadges <= badges);
}

/** Default starting area ID. */
export const DEFAULT_AREA_ID = "pallet-town";
