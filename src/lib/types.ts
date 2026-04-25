// TypeScript types for PokeAPI data

export interface PokemonListItem {
  name: string;
  url: string;
}

export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonListItem[];
}

export interface PokemonType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: {
    name: string;
    url: string;
  };
}

export interface PokemonAbility {
  ability: {
    name: string;
    url: string;
  };
  is_hidden: boolean;
  slot: number;
}

export interface PokemonSprites {
  front_default: string | null;
  other?: {
    "official-artwork"?: {
      front_default: string | null;
    };
  };
}

export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: PokemonType[];
  stats: PokemonStat[];
  abilities: PokemonAbility[];
  sprites: PokemonSprites;
  species: {
    url: string;
  };
}

export interface PokemonSpecies {
  flavor_text_entries: {
    flavor_text: string;
    language: {
      name: string;
    };
    version: {
      name: string;
    };
  }[];
  generation: {
    name: string;
    url: string;
  };
  evolution_chain: {
    url: string;
  };
}

export interface EvolutionChainLink {
  species: {
    name: string;
    url: string;
  };
  evolves_to: EvolutionChainLink[];
}

export interface EvolutionChain {
  chain: EvolutionChainLink;
}

export interface AbilityDetail {
  effect_entries: {
    effect: string;
    short_effect: string;
    language: {
      name: string;
    };
  }[];
  flavor_text_entries: {
    flavor_text: string;
    language: {
      name: string;
    };
  }[];
}

export interface GenerationInfo {
  id: number;
  name: string;
  label: string;
  range: [number, number]; // [start, end] pokemon IDs
}

// Simplified Pokemon for list/card display
export interface PokemonCardData {
  id: number;
  name: string;
  sprite: string | null;
  types: string[];
  stats?: { name: string; base_stat: number }[];
}

// Evolution chain display
export interface EvolutionStep {
  name: string;
  id: number;
  sprite: string | null;
}

// ─── Local Database Types ───────────────────────────────────────────

// Flattened Pokemon record stored in our local JSON database
export interface LocalPokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: string[];
  stats: { name: string; base_stat: number }[];
  abilities: { name: string; is_hidden: boolean; description: string }[];
  sprite: string | null;
  artwork: string | null;
  flavor_text: string;
  generation: string; // e.g. "generation-i"
  evolution_chain: { name: string; id: number; sprite: string | null }[];
}

// API response for paginated list
export interface PokemonListApiResponse {
  pokemon: PokemonCardData[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

// ─── Game / v0.2 Types ────────────────────────────────────────────────

/**
 * A move that a Pokemon can use in battle.
 * Seeded from PokeAPI in v0.2.1; for v0.2.0 we generate simplified moves.
 */
export interface GameMove {
  id: number;
  name: string;
  type: string;
  power: number | null;   // null for status moves
  pp: number;
  damageClass: "physical" | "special" | "status";
}

/**
 * A Pokemon owned by the player.
 * Wraps LocalPokemon data with player-specific state.
 */
export interface OwnedPokemon {
  /** Unique instance ID (uuid) — one player can own multiple of the same species */
  instanceId: string;
  /** Pokedex ID of the species */
  pokemonId: number;
  /** Display name (species name by default, player can nickname in v0.3) */
  nickname: string;
  /** Current level (1–100) */
  level: number;
  /** Current XP within the current level */
  xp: number;
  /** XP needed to reach next level */
  xpToNextLevel: number;
  /** Current HP (can differ from max during/after battle) */
  currentHp: number;
  /** Calculated max HP based on base stat + level */
  maxHp: number;
  /** Calculated stats (attack, defense, etc.) adjusted for level */
  stats: { name: string; value: number }[];
  /** Up to 4 moves */
  moves: (GameMove & { currentPp: number })[];
  /** Species data snapshot (sprite, types, etc.) */
  species: {
    id: number;
    name: string;
    types: string[];
    sprite: string | null;
    artwork: string | null;
    baseStats: { name: string; base_stat: number }[];
    evolutionChain: { name: string; id: number; sprite: string | null }[];
  };
  /** Which area this Pokemon was caught in (or "starter") */
  caughtInArea: string;
  /** Date caught as ISO string */
  caughtAt: string;
}

/**
 * An area/zone of the world. Used for wild encounter level scaling.
 * In v0.2.0 there is a single area ("pallet-town").
 * In v0.3+ multiple areas unlock via the map as the player progresses.
 */
export interface Area {
  id: string;
  name: string;
  /** Level range for wild Pokemon in this area */
  levelRange: [number, number];
  /** Pokemon IDs that can appear here (empty = any) */
  availablePokemonIds: number[];
  /** How many badges needed to access this area (0 = always open) */
  requiredBadges: number;
  /** Catch rate modifier (1 = normal, <1 = harder) */
  catchRateModifier: number;
}

/**
 * All purchasable / holdable item IDs.
 * Extend this union as new items are added.
 */
export type ItemId =
  | "pokeball"
  | "great-ball"
  | "potion"
  | "super-potion"
  | "antidote"     // future
  | "revive";      // future

/** A single item definition from the catalogue. */
export interface ItemDef {
  id: ItemId;
  name: string;
  description: string;
  price: number;       // in PokéDollars
  emoji: string;
  /** PokeAPI sprite URL — https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/{slug}.png */
  sprite: string;
  /** What the item does when used — "heal" | "catch" | "revive" */
  effect: "heal" | "catch" | "revive";
  /** HP restored (for heal items) */
  healAmount?: number;
  /** Catch rate multiplier (for ball items) */
  catchModifier?: number;
}

/** One slot in the player's inventory. */
export interface InventorySlot {
  itemId: ItemId;
  quantity: number;
}

/**
 * A trainer the player can battle for money.
 */
export interface TrainerDef {
  id: string;
  name: string;
  emoji: string;
  /**
   * The Pokémon ID whose front sprite is used as the trainer's avatar.
   * Sprite URL: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{leadPokemonId}.png
   * PokeAPI/sprites has no trainer-class sprites, so we use the trainer's lead Pokémon instead.
   */
  leadPokemonId: number;
  /** Prize money awarded on win */
  reward: number;
  /** How many badges required to challenge this trainer */
  requiredBadges: number;
  /** Party of Pokemon (species ID + level) */
  party: { pokemonId: number; level: number }[];
  /** Flavour text shown before battle */
  intro: string;
}

/**
 * The full player save state stored in localStorage.
 */
export interface PlayerState {
  /** Player's chosen trainer name */
  trainerName: string;
  /** Whether the player has completed starter selection */
  hasStarted: boolean;
  /** Pokemon in the active party (max 6) */
  party: OwnedPokemon[];
  /** Overflow Pokemon stored in PC box (no limit) */
  box: OwnedPokemon[];
  /** Number of Pokeballs the player has (kept for backwards compat) */
  pokeballs: number;
  /** PokéDollar balance */
  money: number;
  /** Item inventory */
  inventory: InventorySlot[];
  /** Number of badges earned */
  badges: number;
  /** IDs of Pokemon species the player has seen (Pokedex) */
  seen: number[];
  /** IDs of Pokemon species the player has caught */
  caught: number[];
  /** Trainer IDs already defeated today (reset on new day) */
  defeatedTrainers: string[];
  /** Current area ID */
  currentAreaId: string;
  /**
   * ISO timestamp of the last Pokéball regen grant.
   * When the player has 0 balls and ≥1 hour has elapsed, they receive 10 free balls.
   */
  lastPokeballRegen: string;
  /** ISO timestamp of last save */
  lastSaved: string;
  /** Save format version — lets us migrate localStorage in future versions */
  saveVersion: number;
}
