/**
 * GET /api/moves/[id]
 *
 * Returns the seeded move set for a given Pokemon ID from data/moves.json.
 * The [id] param is the Pokemon's Pokedex number (e.g. "1" for Bulbasaur).
 *
 * Response: { moves: SeedMove[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

// Loaded once at cold-start and cached in memory
let movesDb: { byPokemon: Record<string, unknown[]>; byId: Record<string, unknown> } | null = null;

function loadMovesDb() {
  if (movesDb) return movesDb;
  try {
    const raw = readFileSync(join(process.cwd(), "data/moves.json"), "utf-8");
    movesDb = JSON.parse(raw);
  } catch {
    movesDb = { byPokemon: {}, byId: {} };
  }
  return movesDb!;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = loadMovesDb();
  const moves = db.byPokemon[id] ?? [];
  return NextResponse.json({ moves });
}
