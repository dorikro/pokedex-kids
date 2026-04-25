/**
 * Status effect lookup table — sourced from PokeAPI move metadata.
 *
 * Maps move ID → ailment + chance so the battle engine can apply status
 * conditions without re-fetching from the API on every turn.
 *
 * ailmentChance is 0–100 (percentage).
 * isPureStatus = true means the move deals no damage — it only inflicts status.
 */

import type { StatusCondition } from "./types";

export interface MoveStatusData {
  ailment: StatusCondition;
  /** 0–100 chance to apply the ailment */
  ailmentChance: number;
  /** True if this is a pure status move (damageClass === "status", power = null) */
  isPureStatus: boolean;
}

export const STATUS_MOVE_DATA: Record<number, MoveStatusData> = {
  // ── Paralysis ────────────────────────────────────────────────────────────────
  86:  { ailment: "paralysis", ailmentChance: 100, isPureStatus: true  }, // Thunder Wave
  137: { ailment: "paralysis", ailmentChance: 100, isPureStatus: true  }, // Glare
  34:  { ailment: "paralysis", ailmentChance: 30,  isPureStatus: false }, // Body Slam
  85:  { ailment: "paralysis", ailmentChance: 10,  isPureStatus: false }, // Thunderbolt
  87:  { ailment: "paralysis", ailmentChance: 30,  isPureStatus: false }, // Thunder
  98:  { ailment: "paralysis", ailmentChance: 30,  isPureStatus: false }, // Quick Attack (simplified)

  // ── Poison ───────────────────────────────────────────────────────────────────
  77:  { ailment: "poison", ailmentChance: 100, isPureStatus: true  }, // Poison Powder
  92:  { ailment: "poison", ailmentChance: 100, isPureStatus: true  }, // Toxic
  40:  { ailment: "poison", ailmentChance: 30,  isPureStatus: false }, // Poison Sting
  41:  { ailment: "poison", ailmentChance: 20,  isPureStatus: false }, // Twineedle
  124: { ailment: "poison", ailmentChance: 30,  isPureStatus: false }, // Sludge
  188: { ailment: "poison", ailmentChance: 30,  isPureStatus: false }, // Sludge Bomb

  // ── Sleep ────────────────────────────────────────────────────────────────────
  79:  { ailment: "sleep", ailmentChance: 100, isPureStatus: true  }, // Sleep Powder
  95:  { ailment: "sleep", ailmentChance: 100, isPureStatus: true  }, // Hypnosis
  147: { ailment: "sleep", ailmentChance: 100, isPureStatus: true  }, // Spore
  50:  { ailment: "sleep", ailmentChance: 75,  isPureStatus: true  }, // Disable (simplified to sleep)

  // ── Burn ─────────────────────────────────────────────────────────────────────
  52:  { ailment: "burn", ailmentChance: 10, isPureStatus: false }, // Ember
  53:  { ailment: "burn", ailmentChance: 10, isPureStatus: false }, // Flamethrower
  126: { ailment: "burn", ailmentChance: 10, isPureStatus: false }, // Fire Blast
  83:  { ailment: "burn", ailmentChance: 10, isPureStatus: false }, // Fire Spin
  155: { ailment: "burn", ailmentChance: 30, isPureStatus: false }, // Scald (water)
  424: { ailment: "burn", ailmentChance: 20, isPureStatus: false }, // Fire Punch

  // ── Freeze ───────────────────────────────────────────────────────────────────
  58:  { ailment: "freeze", ailmentChance: 10, isPureStatus: false }, // Ice Beam
  59:  { ailment: "freeze", ailmentChance: 10, isPureStatus: false }, // Blizzard
  196: { ailment: "freeze", ailmentChance: 10, isPureStatus: false }, // Ice Punch
  333: { ailment: "freeze", ailmentChance: 10, isPureStatus: false }, // Icicle Crash
};

/**
 * Returns a status move to add to a wild Pokémon's moveset based on its type.
 * Returns null if no relevant status move exists for this type.
 */
export function getStatusMoveForType(type: string): (import("./types").GameMove & { currentPp: number }) | null {
  const STATUS_BY_TYPE: Record<string, { id: number; name: string; type: string; pp: number }> = {
    electric: { id: 86,  name: "Thunder Wave",  type: "electric", pp: 20 },
    poison:   { id: 92,  name: "Toxic",         type: "poison",   pp: 10 },
    grass:    { id: 79,  name: "Sleep Powder",  type: "grass",    pp: 15 },
    psychic:  { id: 95,  name: "Hypnosis",      type: "psychic",  pp: 20 },
    normal:   { id: 137, name: "Glare",         type: "normal",   pp: 30 },
  };
  const def = STATUS_BY_TYPE[type];
  if (!def) return null;
  return {
    id: def.id,
    name: def.name,
    type: def.type,
    power: null,
    pp: def.pp,
    currentPp: def.pp,
    damageClass: "status",
    ailment: STATUS_MOVE_DATA[def.id]?.ailment ?? null,
    ailmentChance: STATUS_MOVE_DATA[def.id]?.ailmentChance ?? 0,
  };
}
