import { getPokemon } from "@/lib/pokemon-db";

/**
 * GET /api/pokemon/[id]
 *
 * Returns full Pokemon data by ID or name.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pokemon = getPokemon(id);

  if (!pokemon) {
    return Response.json(
      { error: "Pokemon not found" },
      { status: 404 }
    );
  }

  return Response.json(pokemon);
}
