import type { NextRequest } from "next/server";
import { queryPokemon, StatFilter } from "@/lib/pokemon-db";

const MAX_LIMIT = 100;

/**
 * GET /api/pokemon?offset=0&limit=36&search=pika&types=fire,water&generation=1
 *     &sortBy=speed&sortOrder=desc
 *     &statFilter=hp:50:255,speed:100:255
 *     &includeStats=1
 *
 * Returns a paginated list of Pokemon with optional search, type, generation,
 * stat range filters, and stat sorting.
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

  // Stat sorting
  const sortBy = params.get("sortBy") ?? undefined;
  const sortOrderRaw = params.get("sortOrder");
  const sortOrder: "asc" | "desc" =
    sortOrderRaw === "asc" ? "asc" : "desc";

  // Stat filters: "hp:50:255,speed:100:200" => [{name:"hp",min:50,max:255}, ...]
  const statFilterParam = params.get("statFilter");
  let statFilters: StatFilter[] | undefined;
  if (statFilterParam) {
    statFilters = statFilterParam
      .split(",")
      .map((segment) => {
        const [name, minStr, maxStr] = segment.split(":");
        if (!name) return null;
        const min = minStr ? parseInt(minStr, 10) : undefined;
        const max = maxStr ? parseInt(maxStr, 10) : undefined;
        return {
          name,
          min: min !== undefined && Number.isFinite(min) ? min : undefined,
          max: max !== undefined && Number.isFinite(max) ? max : undefined,
        };
      })
      .filter(Boolean) as StatFilter[];
  }

  const includeStats = params.get("includeStats") === "1";

  const result = queryPokemon({
    offset,
    limit,
    search,
    types,
    generation,
    statFilters,
    sortBy,
    sortOrder,
  });

  // Return card-level data; optionally include stats
  const pokemon = result.pokemon.map((p) => ({
    id: p.id,
    name: p.name,
    sprite: p.sprite,
    types: p.types,
    ...(includeStats
      ? { stats: p.stats }
      : {}),
  }));

  return Response.json({
    pokemon,
    total: result.total,
    offset,
    limit,
    hasMore: result.hasMore,
  });
}
