/**
 * Trainer definitions.
 *
 * Each trainer has a fixed party, a reward, and a badge requirement.
 * Trainer battles are repeatable — `defeatedTrainers` in PlayerState tracks
 * who was beaten, but a trainer can be challenged again at any time
 * (reward is awarded each win, keeping money flow positive for grinding).
 *
 * Future: tie trainers to map areas in v0.3.
 */

import type { TrainerDef } from "./types";

export const TRAINERS: TrainerDef[] = [
  // ── Beginner tier (0 badges) ───────────────────────────────────────────────
  {
    id: "youngster-ben",
    name: "Youngster Ben",
    emoji: "🧒",
    leadPokemonId: 16,  // Pidgey
    reward: 150,
    requiredBadges: 0,
    party: [
      { pokemonId: 19, level: 4 },  // Rattata
      { pokemonId: 16, level: 5 },  // Pidgey
    ],
    intro: "Hey! I just got my first Pokémon! Let's battle!",
  },
  {
    id: "lass-alice",
    name: "Lass Alice",
    emoji: "👧",
    leadPokemonId: 35,  // Clefairy
    reward: 200,
    requiredBadges: 0,
    party: [
      { pokemonId: 35, level: 6 },  // Clefairy
      { pokemonId: 39, level: 5 },  // Jigglypuff
    ],
    intro: "My Pokémon are super cute AND super strong!",
  },
  {
    id: "bug-catcher-tony",
    name: "Bug Catcher Tony",
    emoji: "🐛",
    leadPokemonId: 46,  // Paras
    reward: 180,
    requiredBadges: 0,
    party: [
      { pokemonId: 10, level: 6 },  // Caterpie
      { pokemonId: 13, level: 6 },  // Weedle
      { pokemonId: 46, level: 7 },  // Paras
    ],
    intro: "Bug-type Pokémon are underrated! I'll prove it!",
  },

  // ── Intermediate tier (1 badge) ────────────────────────────────────────────
  {
    id: "hiker-greg",
    name: "Hiker Greg",
    emoji: "⛰️",
    leadPokemonId: 95,  // Onix
    reward: 500,
    requiredBadges: 1,
    party: [
      { pokemonId: 74, level: 12 }, // Geodude
      { pokemonId: 95, level: 14 }, // Onix
    ],
    intro: "I've climbed every mountain in Kanto. Try me!",
  },
  {
    id: "swimmer-kai",
    name: "Swimmer Kai",
    emoji: "🏊",
    leadPokemonId: 60,  // Poliwag
    reward: 480,
    requiredBadges: 1,
    party: [
      { pokemonId: 60, level: 13 }, // Poliwag
      { pokemonId: 72, level: 11 }, // Tentacool
      { pokemonId: 116, level: 13 }, // Horsea
    ],
    intro: "Water Pokémon rule the seas — and this battle!",
  },

  // ── Advanced tier (2 badges) ───────────────────────────────────────────────
  {
    id: "rocker-max",
    name: "Rocker Max",
    emoji: "🎸",
    leadPokemonId: 125, // Electabuzz
    reward: 900,
    requiredBadges: 2,
    party: [
      { pokemonId: 82, level: 20 },  // Magneton
      { pokemonId: 101, level: 21 }, // Electrode
      { pokemonId: 125, level: 22 }, // Electabuzz
    ],
    intro: "My Electric Pokémon will shock you to the core!",
  },
  {
    id: "scientist-vera",
    name: "Scientist Vera",
    emoji: "🔬",
    leadPokemonId: 63,  // Abra
    reward: 1100,
    requiredBadges: 2,
    party: [
      { pokemonId: 63, level: 24 },  // Abra
      { pokemonId: 122, level: 22 }, // Mr. Mime
      { pokemonId: 49, level: 23 },  // Venomoth
    ],
    intro: "My research has optimised every one of my Pokémon's movesets.",
  },

  // ── Expert tier (3+ badges) ───────────────────────────────────────────────
  {
    id: "cooltrainer-rex",
    name: "CoolTrainer Rex",
    emoji: "😎",
    leadPokemonId: 130, // Gyarados
    reward: 2000,
    requiredBadges: 3,
    party: [
      { pokemonId: 58, level: 32 },  // Growlithe
      { pokemonId: 78, level: 33 },  // Rapidash
      { pokemonId: 130, level: 30 }, // Gyarados
    ],
    intro: "You think you're ready for me? Think again.",
  },
  {
    id: "ace-trainer-nina",
    name: "Ace Trainer Nina",
    emoji: "🌟",
    leadPokemonId: 149, // Dragonite
    reward: 2800,
    requiredBadges: 4,
    party: [
      { pokemonId: 65, level: 40 },  // Alakazam
      { pokemonId: 103, level: 38 }, // Exeggutor
      { pokemonId: 112, level: 39 }, // Rhydon
      { pokemonId: 149, level: 42 }, // Dragonite
    ],
    intro: "I've trained for years. This battle will test everything you have.",
  },
];

/** Return trainers available to a player with the given badge count. */
export function getAvailableTrainers(badges: number): TrainerDef[] {
  return TRAINERS.filter((t) => t.requiredBadges <= badges);
}

/** Look up a trainer by ID. */
export function getTrainer(id: string): TrainerDef | undefined {
  return TRAINERS.find((t) => t.id === id);
}
