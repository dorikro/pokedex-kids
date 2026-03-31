import { readFileSync } from "fs";
import { join } from "path";
import { LocalPokemon } from "./types";
import { GENERATIONS } from "./constants";

// Load Pokemon data from JSON file at startup (cached in module scope)
let _pokemonData: LocalPokemon[] | null = null;
let _pokemonById: Map<number, LocalPokemon> | null = null;
let _pokemonByName: Map<string, LocalPokemon> | null = null;

function loadData(): LocalPokemon[] {
  if (_pokemonData) return _pokemonData;

  const filePath = join(process.cwd(), "data", "pokemon.json");
  const raw = readFileSync(filePath, "utf-8");
  _pokemonData = JSON.parse(raw) as LocalPokemon[];

  // Build lookup maps
  _pokemonById = new Map();
  _pokemonByName = new Map();
  for (const p of _pokemonData) {
    _pokemonById.set(p.id, p);
    _pokemonByName.set(p.name.toLowerCase(), p);
  }

  return _pokemonData;
}

function getById(): Map<number, LocalPokemon> {
  loadData();
  return _pokemonById!;
}

function getByName(): Map<string, LocalPokemon> {
  loadData();
  return _pokemonByName!;
}

// Valid stat names for sorting/filtering
const VALID_STATS = ["hp", "attack", "defense", "special-attack", "special-defense", "speed", "total"];

// Helper: get a stat value from a pokemon (supports "total" as a virtual stat)
function getStatValue(p: LocalPokemon, statName: string): number {
  if (statName === "total") {
    return p.stats.reduce((sum, s) => sum + s.base_stat, 0);
  }
  return p.stats.find((s) => s.name === statName)?.base_stat ?? 0;
}

export interface StatFilter {
  name: string;  // stat name (e.g. "hp", "speed", "total")
  min?: number;
  max?: number;
}

/**
 * Get a paginated, filtered list of Pokemon.
 */
export function queryPokemon(options: {
  offset?: number;
  limit?: number;
  search?: string;
  types?: string[];
  generation?: number | null;
  statFilters?: StatFilter[];
  sortBy?: string;       // stat name to sort by
  sortOrder?: "asc" | "desc";
}): { pokemon: LocalPokemon[]; total: number; hasMore: boolean } {
  const { offset = 0, limit = 36, search, types, generation, statFilters, sortBy, sortOrder = "desc" } = options;
  let data = loadData();

  // Filter by generation (ID range)
  if (generation) {
    const gen = GENERATIONS.find((g) => g.id === generation);
    if (gen) {
      const [start, end] = gen.range;
      data = data.filter((p) => p.id >= start && p.id <= end);
    }
  }

  // Filter by search query (name or ID)
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    data = data.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toString() === q ||
        p.id.toString().padStart(4, "0").includes(q)
    );
  }

  // Filter by types (match any)
  if (types && types.length > 0) {
    data = data.filter((p) =>
      types.some((type) => p.types.includes(type))
    );
  }

  // Filter by stat ranges
  if (statFilters && statFilters.length > 0) {
    for (const sf of statFilters) {
      if (!VALID_STATS.includes(sf.name)) continue;
      data = data.filter((p) => {
        const val = getStatValue(p, sf.name);
        if (sf.min !== undefined && val < sf.min) return false;
        if (sf.max !== undefined && val > sf.max) return false;
        return true;
      });
    }
  }

  // Sort by stat
  if (sortBy && VALID_STATS.includes(sortBy)) {
    const dir = sortOrder === "asc" ? 1 : -1;
    data = [...data].sort((a, b) => {
      const va = getStatValue(a, sortBy);
      const vb = getStatValue(b, sortBy);
      return (va - vb) * dir;
    });
  }

  const total = data.length;
  const sliced = data.slice(offset, offset + limit);

  return {
    pokemon: sliced,
    total,
    hasMore: offset + limit < total,
  };
}

/**
 * Get a single Pokemon by ID or name.
 */
export function getPokemon(idOrName: string): LocalPokemon | null {
  const asNum = parseInt(idOrName, 10);
  if (!isNaN(asNum)) {
    return getById().get(asNum) ?? null;
  }
  return getByName().get(idOrName.toLowerCase()) ?? null;
}
