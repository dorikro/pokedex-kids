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

/**
 * Get a paginated, filtered list of Pokemon.
 */
export function queryPokemon(options: {
  offset?: number;
  limit?: number;
  search?: string;
  types?: string[];
  generation?: number | null;
}): { pokemon: LocalPokemon[]; total: number; hasMore: boolean } {
  const { offset = 0, limit = 36, search, types, generation } = options;
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
