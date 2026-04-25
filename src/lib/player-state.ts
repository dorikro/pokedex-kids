/**
 * Player state manager — localStorage persistence layer.
 *
 * All game state (party, box, Pokeballs, badges, Pokedex) lives here.
 * In v0.3 this module will grow a `syncToCloud()` method that pushes state
 * to Supabase on login, while keeping localStorage as the offline cache.
 */

import type { OwnedPokemon, PlayerState } from "./types";
import type { LocalPokemon } from "./types";
import { DEFAULT_AREA_ID } from "./areas";

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "pokedex-kids-player";
const SAVE_VERSION = 1;
const MAX_PARTY_SIZE = 6;
const STARTER_POKEBALLS = 10;

// ─── XP & Stat calculations ───────────────────────────────────────────────────

/**
 * XP needed to reach a given level using the "medium-fast" curve.
 * Formula: level^3
 */
export function xpForLevel(level: number): number {
  return Math.pow(level, 3);
}

/** XP awarded for defeating / catching a wild Pokemon at a given level. */
export function xpReward(wildLevel: number, caught: boolean): number {
  const base = Math.round(wildLevel * 10);
  return caught ? Math.round(base * 1.5) : base;
}

/**
 * Calculate a stat value at a given level from a base stat.
 * Simplified formula (no EVs/IVs for kids-friendly play):
 *   HP  = floor((2 * base * level) / 100) + level + 10
 *   Else = floor((2 * base * level) / 100) + 5
 */
export function calcStat(statName: string, baseStat: number, level: number): number {
  if (statName === "hp") {
    return Math.floor((2 * baseStat * level) / 100) + level + 10;
  }
  return Math.floor((2 * baseStat * level) / 100) + 5;
}

// ─── Owned Pokemon factory ────────────────────────────────────────────────────

/** Generate 4 simplified moves for a Pokemon based on its types and level. */
function generateMoves(species: LocalPokemon, level: number) {
  // Minimal type-based move set — will be replaced by seeded moves in v0.2.1
  const typeMove = (type: string, power: number, pp: number) => ({
    id: 0,
    name: type.charAt(0).toUpperCase() + type.slice(1) + " Attack",
    type,
    power,
    pp,
    damageClass: "physical" as const,
    currentPp: pp,
  });

  const moves = species.types.map((t, i) =>
    typeMove(t, 40 + i * 10, 20)
  );

  // Always include a Normal-type move (Tackle equivalent)
  if (!species.types.includes("normal")) {
    moves.push(typeMove("normal", 35, 35));
  }

  // Pad to 4 if needed — add a generic "Struggle" equivalent
  while (moves.length < 4) {
    moves.push({
      id: 0,
      name: "Struggle",
      type: "normal",
      power: 50,
      pp: 10,
      damageClass: "physical" as const,
      currentPp: 10,
    });
  }

  return moves.slice(0, 4);
}

/** Create a new OwnedPokemon instance from a LocalPokemon at a given level. */
export function createOwnedPokemon(
  species: LocalPokemon,
  level: number,
  caughtInArea: string
): OwnedPokemon {
  const instanceId = `${species.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const stats = species.stats.map((s) => ({
    name: s.name,
    value: calcStat(s.name, s.base_stat, level),
  }));

  const hpStat = stats.find((s) => s.name === "hp");
  const maxHp = hpStat?.value ?? calcStat("hp", 45, level);

  return {
    instanceId,
    pokemonId: species.id,
    nickname: species.name,
    level,
    xp: xpForLevel(level),
    xpToNextLevel: xpForLevel(level + 1),
    currentHp: maxHp,
    maxHp,
    stats,
    moves: generateMoves(species, level),
    species: {
      id: species.id,
      name: species.name,
      types: species.types,
      sprite: species.sprite,
      artwork: species.artwork,
      baseStats: species.stats,
      evolutionChain: species.evolution_chain,
    },
    caughtInArea,
    caughtAt: new Date().toISOString(),
  };
}

// ─── Default state ────────────────────────────────────────────────────────────

function defaultState(): PlayerState {
  return {
    trainerName: "Trainer",
    hasStarted: false,
    party: [],
    box: [],
    pokeballs: STARTER_POKEBALLS,
    badges: 0,
    seen: [],
    caught: [],
    currentAreaId: DEFAULT_AREA_ID,
    lastSaved: new Date().toISOString(),
    saveVersion: SAVE_VERSION,
  };
}

// ─── Persistence ──────────────────────────────────────────────────────────────

function load(): PlayerState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as PlayerState;
    // Future: if parsed.saveVersion < SAVE_VERSION → run migration
    return parsed;
  } catch {
    return defaultState();
  }
}

function save(state: PlayerState): void {
  if (typeof window === "undefined") return;
  try {
    state.lastSaved = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.error("Failed to save player state to localStorage");
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const playerState = {
  /** Read the current state. Safe to call on every render. */
  get(): PlayerState {
    return load();
  },

  /** Overwrite the full state and persist. */
  set(state: PlayerState): void {
    save(state);
  },

  /** Reset everything (new game). */
  reset(): PlayerState {
    const fresh = defaultState();
    save(fresh);
    return fresh;
  },

  /** Mark the player as having chosen a starter. */
  completeStarterSelection(state: PlayerState, starter: OwnedPokemon, trainerName: string): PlayerState {
    const next: PlayerState = {
      ...state,
      trainerName,
      hasStarted: true,
      party: [starter],
      seen: [starter.pokemonId],
      caught: [starter.pokemonId],
    };
    save(next);
    return next;
  },

  /** Add a Pokemon to party (if space) or box. Returns updated state. */
  addPokemon(state: PlayerState, pokemon: OwnedPokemon): PlayerState {
    const next: PlayerState = {
      ...state,
      party: state.party.length < MAX_PARTY_SIZE
        ? [...state.party, pokemon]
        : state.party,
      box: state.party.length >= MAX_PARTY_SIZE
        ? [...state.box, pokemon]
        : state.box,
      seen: state.seen.includes(pokemon.pokemonId)
        ? state.seen
        : [...state.seen, pokemon.pokemonId],
      caught: state.caught.includes(pokemon.pokemonId)
        ? state.caught
        : [...state.caught, pokemon.pokemonId],
    };
    save(next);
    return next;
  },

  /** Move a Pokemon from box to party (if party has space). */
  moveToParty(state: PlayerState, instanceId: string): PlayerState {
    if (state.party.length >= MAX_PARTY_SIZE) return state;
    const pokemon = state.box.find((p) => p.instanceId === instanceId);
    if (!pokemon) return state;
    const next: PlayerState = {
      ...state,
      party: [...state.party, pokemon],
      box: state.box.filter((p) => p.instanceId !== instanceId),
    };
    save(next);
    return next;
  },

  /** Move a Pokemon from party to box (must keep at least 1 in party). */
  moveToBox(state: PlayerState, instanceId: string): PlayerState {
    if (state.party.length <= 1) return state; // can't bench last Pokemon
    const pokemon = state.party.find((p) => p.instanceId === instanceId);
    if (!pokemon) return state;
    const next: PlayerState = {
      ...state,
      party: state.party.filter((p) => p.instanceId !== instanceId),
      box: [...state.box, pokemon],
    };
    save(next);
    return next;
  },

  /** Release a Pokemon (remove from party or box). Can't release last party member. */
  release(state: PlayerState, instanceId: string): PlayerState {
    const inParty = state.party.some((p) => p.instanceId === instanceId);
    if (inParty && state.party.length <= 1) return state;
    const next: PlayerState = {
      ...state,
      party: state.party.filter((p) => p.instanceId !== instanceId),
      box: state.box.filter((p) => p.instanceId !== instanceId),
    };
    save(next);
    return next;
  },

  /** Spend a Pokeball. Returns false if none left. */
  spendPokeball(state: PlayerState): { ok: boolean; state: PlayerState } {
    if (state.pokeballs <= 0) return { ok: false, state };
    const next: PlayerState = { ...state, pokeballs: state.pokeballs - 1 };
    save(next);
    return { ok: true, state: next };
  },

  /** Add Pokeballs (e.g. from a shop or reward). */
  addPokeballs(state: PlayerState, count: number): PlayerState {
    const next: PlayerState = { ...state, pokeballs: state.pokeballs + count };
    save(next);
    return next;
  },

  /** Mark a Pokemon as seen in the Pokedex. */
  markSeen(state: PlayerState, pokemonId: number): PlayerState {
    if (state.seen.includes(pokemonId)) return state;
    const next: PlayerState = { ...state, seen: [...state.seen, pokemonId] };
    save(next);
    return next;
  },

  /** Update a single OwnedPokemon in party or box (e.g. after gaining XP). */
  updatePokemon(state: PlayerState, updated: OwnedPokemon): PlayerState {
    const next: PlayerState = {
      ...state,
      party: state.party.map((p) => p.instanceId === updated.instanceId ? updated : p),
      box: state.box.map((p) => p.instanceId === updated.instanceId ? updated : p),
    };
    save(next);
    return next;
  },

  /** Constants exported for consumers */
  MAX_PARTY_SIZE,
  STARTER_POKEBALLS,
};
