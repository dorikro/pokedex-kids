import type { NextRequest } from "next/server";
import { queryPokemon } from "@/lib/pokemon-db";

const MAX_LIMIT = 100;

/**
 * GET /api/pokemon?offset=0&limit=36&search=pika&types=fire,water&generation=1
 *
 * Returns a paginated list of Pokemon with optional search, type, and generation filters.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const rawOffset = parseInt(params.get("offset") ?? "0", 10);
  const rawLimit = parseInt(params.get("limit") ?? "36", 10);
  const offset = Math.max(Number.isFinite(rawOffset) ? rawOffset : 0, 0);
  const limit = Math.min(
    Math.max(Number.isFinite(rawLimit) ? rawLimit : 36, 1),
    MAX_LIMIT
  );
  const search = params.get("search") ?? undefined;
  const typesParam = params.get("types");
  const types = typesParam ? typesParam.split(",").filter(Boolean) : undefined;
  const genParam = params.get("generation");
  const generation = genParam ? parseInt(genParam, 10) : null;

  const result = queryPokemon({ offset, limit, search, types, generation });

  // Return only card-level data for the list (lighter payload)
  const pokemon = result.pokemon.map((p) => ({
    id: p.id,
    name: p.name,
    sprite: p.sprite,
    types: p.types,
  }));

  return Response.json({
    pokemon,
    total: result.total,
    offset,
    limit,
    hasMore: result.hasMore,
  });
}
