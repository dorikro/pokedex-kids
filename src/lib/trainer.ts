/**
 * Trainer definitions — v0.2.4
 *
 * Tier 0 (0 badges): Youngster Ben, Lass Alice, Bug Catcher Tony → Gym Leader Brock
 * Tier 1 (1 badge):  Hiker Greg, Swimmer Kai                     → Gym Leader Misty
 * Tier 2 (2 badges): Rocker Max, Scientist Vera                   → Gym Leader Lt. Surge
 * Tier 3 (3 badges): CoolTrainer Rex                              → Gym Leader Erika
 * Tier 4 (4 badges): Ace Trainer Nina (no GL yet)
 *
 * Gym Leaders require:
 *  - The required badge count for that tier
 *  - ALL regular trainers in the tier defeated (defeatedTrainerIds)
 *  - Party average level ≥ gymLeaderLevelReq
 */

import type { TrainerDef } from "./types";

export const TRAINERS: TrainerDef[] = [
  // ── Tier 0 — 0 badges ────────────────────────────────────────────────────
  {
    id: "youngster-ben",
    name: "Youngster Ben",
    emoji: "🧒",
    leadPokemonId: 16,
    reward: 150,
    requiredBadges: 0,
    party: [
      { pokemonId: 19, level: 4 },
      { pokemonId: 16, level: 5 },
    ],
    intro: "Hey! I just got my first Pokémon! Let's battle!",
  },
  {
    id: "lass-alice",
    name: "Lass Alice",
    emoji: "👧",
    leadPokemonId: 35,
    reward: 200,
    requiredBadges: 0,
    party: [
      { pokemonId: 35, level: 6 },
      { pokemonId: 39, level: 5 },
    ],
    intro: "My Pokémon are super cute AND super strong!",
  },
  {
    id: "bug-catcher-tony",
    name: "Bug Catcher Tony",
    emoji: "🐛",
    leadPokemonId: 46,
    reward: 180,
    requiredBadges: 0,
    party: [
      { pokemonId: 10, level: 6 },
      { pokemonId: 13, level: 6 },
      { pokemonId: 46, level: 7 },
    ],
    intro: "Bug-type Pokémon are underrated! I'll prove it!",
  },
  {
    id: "brock",
    name: "Brock",
    emoji: "🪨",
    leadPokemonId: 95,   // Onix sprite as avatar
    reward: 1000,
    requiredBadges: 0,
    isGymLeader: true,
    badgeAwarded: 1,
    gymLeaderLevelReq: 10,
    gymLeaderTrainerReqs: ["youngster-ben", "lass-alice", "bug-catcher-tony"],
    party: [
      { pokemonId: 74, level: 10 },  // Geodude
      { pokemonId: 95, level: 12 },  // Onix
    ],
    intro: "I'm Brock, the Pewter City Gym Leader! My rock-hard willpower is evident in my Pokémon!",
  },

  // ── Tier 1 — 1 badge ─────────────────────────────────────────────────────
  {
    id: "hiker-greg",
    name: "Hiker Greg",
    emoji: "⛰️",
    leadPokemonId: 95,
    reward: 500,
    requiredBadges: 1,
    party: [
      { pokemonId: 74, level: 12 },
      { pokemonId: 95, level: 14 },
    ],
    intro: "I've climbed every mountain in Kanto. Try me!",
  },
  {
    id: "swimmer-kai",
    name: "Swimmer Kai",
    emoji: "🏊",
    leadPokemonId: 60,
    reward: 480,
    requiredBadges: 1,
    party: [
      { pokemonId: 60, level: 13 },
      { pokemonId: 72, level: 11 },
      { pokemonId: 116, level: 13 },
    ],
    intro: "Water Pokémon rule the seas — and this battle!",
  },
  {
    id: "misty",
    name: "Misty",
    emoji: "💧",
    leadPokemonId: 121,  // Starmie
    reward: 1800,
    requiredBadges: 1,
    isGymLeader: true,
    badgeAwarded: 2,
    gymLeaderLevelReq: 20,
    gymLeaderTrainerReqs: ["hiker-greg", "swimmer-kai"],
    party: [
      { pokemonId: 120, level: 18 },  // Staryu
      { pokemonId: 121, level: 21 },  // Starmie
    ],
    intro: "I'm Misty, the Cerulean City Gym Leader! My Pokémon are as beautiful and unpredictable as the sea!",
  },

  // ── Tier 2 — 2 badges ────────────────────────────────────────────────────
  {
    id: "rocker-max",
    name: "Rocker Max",
    emoji: "🎸",
    leadPokemonId: 125,
    reward: 900,
    requiredBadges: 2,
    party: [
      { pokemonId: 82,  level: 20 },
      { pokemonId: 101, level: 21 },
      { pokemonId: 125, level: 22 },
    ],
    intro: "My Electric Pokémon will shock you to the core!",
  },
  {
    id: "scientist-vera",
    name: "Scientist Vera",
    emoji: "🔬",
    leadPokemonId: 63,
    reward: 1100,
    requiredBadges: 2,
    party: [
      { pokemonId: 63,  level: 24 },
      { pokemonId: 122, level: 22 },
      { pokemonId: 49,  level: 23 },
    ],
    intro: "My research has optimised every one of my Pokémon's movesets.",
  },
  {
    id: "lt-surge",
    name: "Lt. Surge",
    emoji: "⚡",
    leadPokemonId: 26,   // Raichu
    reward: 2500,
    requiredBadges: 2,
    isGymLeader: true,
    badgeAwarded: 3,
    gymLeaderLevelReq: 30,
    gymLeaderTrainerReqs: ["rocker-max", "scientist-vera"],
    party: [
      { pokemonId: 100, level: 28 },  // Voltorb
      { pokemonId: 26,  level: 30 },  // Raichu
      { pokemonId: 82,  level: 28 },  // Magneton
    ],
    intro: "I'm Lt. Surge, the Lightning American! My Pokémon will zap you into next week!",
  },

  // ── Tier 3 — 3 badges ────────────────────────────────────────────────────
  {
    id: "cooltrainer-rex",
    name: "CoolTrainer Rex",
    emoji: "😎",
    leadPokemonId: 130,
    reward: 2000,
    requiredBadges: 3,
    party: [
      { pokemonId: 58,  level: 32 },
      { pokemonId: 78,  level: 33 },
      { pokemonId: 130, level: 30 },
    ],
    intro: "You think you're ready for me? Think again.",
  },
  {
    id: "erika",
    name: "Erika",
    emoji: "🌸",
    leadPokemonId: 45,   // Vileplume
    reward: 3200,
    requiredBadges: 3,
    isGymLeader: true,
    badgeAwarded: 4,
    gymLeaderLevelReq: 40,
    gymLeaderTrainerReqs: ["cooltrainer-rex"],
    party: [
      { pokemonId: 71,  level: 36 },  // Victreebel
      { pokemonId: 45,  level: 38 },  // Vileplume
      { pokemonId: 103, level: 37 },  // Exeggutor
    ],
    intro: "I'm Erika, the Celadon City Gym Leader. My Grass-type Pokémon will put you to sleep!",
  },

  // ── Tier 4 — 4 badges ────────────────────────────────────────────────────
  {
    id: "ace-trainer-nina",
    name: "Ace Trainer Nina",
    emoji: "🌟",
    leadPokemonId: 149,
    reward: 2800,
    requiredBadges: 4,
    party: [
      { pokemonId: 65,  level: 40 },
      { pokemonId: 103, level: 38 },
      { pokemonId: 112, level: 39 },
      { pokemonId: 149, level: 42 },
    ],
    intro: "I've trained for years. This battle will test everything you have.",
  },
];

/** Return trainers (non-Gym-Leader) available to a player with the given badge count. */
export function getAvailableTrainers(badges: number): TrainerDef[] {
  return TRAINERS.filter((t) => !t.isGymLeader && t.requiredBadges <= badges);
}

/** Return Gym Leaders available (badge gated) but not necessarily unlocked yet. */
export function getGymLeaders(): TrainerDef[] {
  return TRAINERS.filter((t) => t.isGymLeader);
}

/** Look up a trainer by ID. */
export function getTrainer(id: string): TrainerDef | undefined {
  return TRAINERS.find((t) => t.id === id);
}
