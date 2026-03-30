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
