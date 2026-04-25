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
import { TYPE_EFFECTIVENESS } from "./constants";

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

// ─── Evolution helpers ────────────────────────────────────────────────────────

/**
 * Gen 1 evolution level thresholds.
 * Key = Pokemon ID that evolves, Value = [level threshold, target ID]
 */
const EVOLUTION_LEVELS: Record<number, [number, number]> = {
  // Bulbasaur → Ivysaur → Venusaur
  1: [16, 2], 2: [32, 3],
  // Charmander → Charmeleon → Charizard
  4: [16, 5], 5: [36, 6],
  // Squirtle → Wartortle → Blastoise
  7: [16, 8], 8: [36, 9],
  // Caterpie → Metapod → Butterfree
  10: [7, 11], 11: [10, 12],
  // Weedle → Kakuna → Beedrill
  13: [7, 14], 14: [10, 15],
  // Pidgey → Pidgeotto → Pidgeot
  16: [18, 17], 17: [36, 18],
  // Rattata → Raticate
  19: [20, 20],
  // Spearow → Fearow
  21: [20, 22],
  // Ekans → Arbok
  23: [22, 24],
  // Pikachu → Raichu (stone, skip for now)
  // Sandshrew → Sandslash
  27: [22, 28],
  // Nidoran♀ → Nidorina → Nidoqueen (stone at 16, skip)
  29: [16, 30],
  // Nidoran♂ → Nidorino → Nidoking (stone)
  32: [16, 33],
  // Vulpix → Ninetales (stone)
  // Jigglypuff → Wigglytuff (stone)
  // Zubat → Golbat
  41: [22, 42],
  // Oddish → Gloom → Vileplume (stone at 21)
  43: [21, 44],
  // Paras → Parasect
  46: [24, 47],
  // Venonat → Venomoth
  48: [31, 49],
  // Diglett → Dugtrio
  50: [26, 51],
  // Meowth → Persian
  52: [28, 53],
  // Psyduck → Golduck
  54: [33, 55],
  // Mankey → Primeape
  56: [28, 57],
  // Growlithe → Arcanine (stone)
  // Poliwag → Poliwhirl → Poliwrath (stone at 25)
  60: [25, 61],
  // Abra → Kadabra → Alakazam (trade)
  63: [16, 64],
  // Machop → Machoke → Machamp (trade at 28)
  66: [28, 67],
  // Bellsprout → Weepinbell → Victreebel (stone at 21)
  69: [21, 70],
  // Tentacool → Tentacruel
  72: [30, 73],
  // Geodude → Graveler → Golem (trade at 25)
  74: [25, 75],
  // Ponyta → Rapidash
  77: [40, 78],
  // Slowpoke → Slowbro (trade at 37)
  79: [37, 80],
  // Magnemite → Magneton
  81: [30, 82],
  // Doduo → Dodrio
  84: [31, 85],
  // Seel → Dewgong
  86: [34, 87],
  // Grimer → Muk
  88: [38, 89],
  // Shellder → Cloyster (stone)
  // Gastly → Haunter → Gengar (trade at 25)
  92: [25, 93],
  // Onix → Steelix (trade, skip)
  // Drowzee → Hypno
  96: [26, 97],
  // Krabby → Kingler
  98: [28, 99],
  // Voltorb → Electrode
  100: [30, 101],
  // Exeggcute → Exeggutor (stone)
  // Cubone → Marowak
  104: [28, 105],
  // Koffing → Weezing
  109: [35, 110],
  // Rhyhorn → Rhydon
  111: [42, 112],
  // Horsea → Seadra
  116: [32, 117],
  // Goldeen → Seaking
  118: [33, 119],
  // Staryu → Starmie (stone)
  // Magikarp → Gyarados
  129: [20, 130],
  // Eevee → Vaporeon/Flareon/Jolteon (stone, skip)
  // Omanyte → Omastar
  138: [40, 139],
  // Kabuto → Kabutops
  140: [40, 141],
  // Dratini → Dragonair → Dragonite
  147: [30, 148], 148: [55, 149],
};

export interface LevelUpResult {
  pokemon: OwnedPokemon;
  levelsGained: number;
  evolved: boolean;
  evolutionTargetId: number | null;
}

/**
 * Award XP to a Pokemon and process level-ups.
 * Returns the updated Pokemon and metadata about what happened.
 * NOTE: Does NOT mutate player state — caller is responsible for saving.
 */
export function awardXp(pokemon: OwnedPokemon, xpAmount: number): LevelUpResult {
  let updated = { ...pokemon, xp: pokemon.xp + xpAmount };
  let levelsGained = 0;
  let evolved = false;
  let evolutionTargetId: number | null = null;

  // Process level-ups (could gain multiple at once)
  while (updated.level < 100 && updated.xp >= updated.xpToNextLevel) {
    updated = levelUp(updated);
    levelsGained++;
  }

  // Check evolution after leveling
  if (levelsGained > 0) {
    const evoEntry = EVOLUTION_LEVELS[updated.pokemonId];
    if (evoEntry) {
      const [evoLevel, targetId] = evoEntry;
      if (updated.level >= evoLevel) {
        evolved = true;
        evolutionTargetId = targetId;
      }
    }
  }

  return { pokemon: updated, levelsGained, evolved, evolutionTargetId };
}

/** Apply one level-up to a Pokemon, recalculating stats. */
function levelUp(pokemon: OwnedPokemon): OwnedPokemon {
  const newLevel = pokemon.level + 1;
  const newStats = pokemon.species.baseStats.map((s) => ({
    name: s.name,
    value: calcStat(s.name, s.base_stat, newLevel),
  }));
  const hpStat = newStats.find((s) => s.name === "hp");
  const newMaxHp = hpStat?.value ?? pokemon.maxHp;
  // Restore HP proportionally
  const hpRatio = pokemon.currentHp / pokemon.maxHp;

  return {
    ...pokemon,
    level: newLevel,
    xp: pokemon.xp,
    xpToNextLevel: xpForLevel(newLevel + 1),
    maxHp: newMaxHp,
    currentHp: Math.round(newMaxHp * hpRatio),
    stats: newStats,
  };
}

// ─── Owned Pokemon factory ────────────────────────────────────────────────────

/** Generate 4 simplified moves for a Pokemon based on its types and level. */
function generateMoves(species: LocalPokemon, _level: number) {
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

  if (!species.types.includes("normal")) {
    moves.push(typeMove("normal", 35, 35));
  }

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

/**
 * Upgrade an OwnedPokemon's move set from seeded move data.
 * Called after the moves API loads — replaces synthetic moves with real ones.
 */
export function applyRealMoves(
  pokemon: OwnedPokemon,
  seedMoves: { id: number; name: string; type: string; power: number | null; pp: number; damageClass: string; learnLevel: number }[]
): OwnedPokemon {
  if (!seedMoves || seedMoves.length === 0) return pokemon;
  const moves = seedMoves.slice(0, 4).map((m) => ({
    id: m.id,
    name: m.name,
    type: m.type,
    power: m.power,
    pp: m.pp,
    damageClass: m.damageClass as "physical" | "special" | "status",
    currentPp: m.pp,
  }));
  return { ...pokemon, moves };
}

// ─── Battle damage calculation ────────────────────────────────────────────────

export interface DamageResult {
  damage: number;
  typeMultiplier: number;
  isCritical: boolean;
  effectiveness: "super" | "normal" | "weak" | "immune";
}

/**
 * Calculate damage for one move used by attacker against defender.
 * Simplified Gen 1 formula: ((2*level/5 + 2) * power * atk/def / 50 + 2) * type * random
 */
export function calculateDamage(
  attackerLevel: number,
  movePower: number,
  moveType: string,
  moveDamageClass: string,
  attackerStats: { name: string; value: number }[],
  defenderStats: { name: string; value: number }[],
  defenderTypes: string[]
): DamageResult {
  // Get relevant attack and defense stats
  const isSpecial = moveDamageClass === "special";
  const atkStatName = isSpecial ? "special-attack" : "attack";
  const defStatName = isSpecial ? "special-defense" : "defense";

  const atk = attackerStats.find((s) => s.name === atkStatName)?.value ?? 50;
  const def = defenderStats.find((s) => s.name === defStatName)?.value ?? 50;

  // Type effectiveness
  let typeMultiplier = 1;
  for (const defType of defenderTypes) {
    const eff = TYPE_EFFECTIVENESS[moveType]?.[defType];
    if (eff !== undefined) typeMultiplier *= eff;
  }

  const effectiveness: DamageResult["effectiveness"] =
    typeMultiplier === 0 ? "immune"
    : typeMultiplier > 1 ? "super"
    : typeMultiplier < 1 ? "weak"
    : "normal";

  // Critical hit: 6.25% chance, 1.5x damage
  const isCritical = Math.random() < 0.0625;
  const critMultiplier = isCritical ? 1.5 : 1;

  // Random factor [0.85, 1.0]
  const random = 0.85 + Math.random() * 0.15;

  const baseDamage =
    (((2 * attackerLevel) / 5 + 2) * movePower * (atk / def)) / 50 + 2;

  const damage = Math.max(
    1,
    Math.round(baseDamage * typeMultiplier * critMultiplier * random)
  );

  return { damage, typeMultiplier, isCritical, effectiveness };
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
  get(): PlayerState { return load(); },
  set(state: PlayerState): void { save(state); },
  reset(): PlayerState {
    const fresh = defaultState();
    save(fresh);
    return fresh;
  },
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
  addPokemon(state: PlayerState, pokemon: OwnedPokemon): PlayerState {
    const next: PlayerState = {
      ...state,
      party: state.party.length < MAX_PARTY_SIZE ? [...state.party, pokemon] : state.party,
      box: state.party.length >= MAX_PARTY_SIZE ? [...state.box, pokemon] : state.box,
      seen: state.seen.includes(pokemon.pokemonId) ? state.seen : [...state.seen, pokemon.pokemonId],
      caught: state.caught.includes(pokemon.pokemonId) ? state.caught : [...state.caught, pokemon.pokemonId],
    };
    save(next);
    return next;
  },
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
  moveToBox(state: PlayerState, instanceId: string): PlayerState {
    if (state.party.length <= 1) return state;
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
  spendPokeball(state: PlayerState): { ok: boolean; state: PlayerState } {
    if (state.pokeballs <= 0) return { ok: false, state };
    const next: PlayerState = { ...state, pokeballs: state.pokeballs - 1 };
    save(next);
    return { ok: true, state: next };
  },
  addPokeballs(state: PlayerState, count: number): PlayerState {
    const next: PlayerState = { ...state, pokeballs: state.pokeballs + count };
    save(next);
    return next;
  },
  markSeen(state: PlayerState, pokemonId: number): PlayerState {
    if (state.seen.includes(pokemonId)) return state;
    const next: PlayerState = { ...state, seen: [...state.seen, pokemonId] };
    save(next);
    return next;
  },
  updatePokemon(state: PlayerState, updated: OwnedPokemon): PlayerState {
    const next: PlayerState = {
      ...state,
      party: state.party.map((p) => p.instanceId === updated.instanceId ? updated : p),
      box: state.box.map((p) => p.instanceId === updated.instanceId ? updated : p),
    };
    save(next);
    return next;
  },
  /**
   * Award XP to the lead party Pokemon after a battle/catch.
   * Handles level-up and returns metadata for the UI to show messages.
   */
  awardBattleXp(
    state: PlayerState,
    partyIndex: number,
    xpAmount: number
  ): { state: PlayerState; result: LevelUpResult } {
    const pokemon = state.party[partyIndex];
    if (!pokemon) return { state, result: { pokemon, levelsGained: 0, evolved: false, evolutionTargetId: null } };
    const result = awardXp(pokemon, xpAmount);
    const next: PlayerState = {
      ...state,
      party: state.party.map((p, i) => i === partyIndex ? result.pokemon : p),
    };
    save(next);
    return { state: next, result };
  },
  MAX_PARTY_SIZE,
  STARTER_POKEBALLS,
};
