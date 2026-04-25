/**
 * Turn-based battle engine — v0.2.1
 *
 * Pure functions only. No state, no side effects.
 * The battle UI drives the state machine; this file is the rules engine.
 *
 * Battle flow:
 *   1. Player picks a move (or tries to flee)
 *   2. Enemy AI picks a move
 *   3. Faster Pokemon attacks first (speed stat)
 *   4. Apply damage, check for KO
 *   5. Repeat until one side faints or player flees
 */

import { calculateDamage, calcStat } from "./player-state";
import { TYPE_EFFECTIVENESS } from "./constants";
import type { OwnedPokemon } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BattleEventKind =
  | "move_used"      // a move was used
  | "damage"         // HP was reduced
  | "effectiveness"  // type effectiveness message
  | "critical"       // critical hit
  | "ko"             // a Pokemon fainted
  | "flee_success"   // player fled
  | "flee_fail"      // player failed to flee
  | "xp_gained"      // XP awarded
  | "level_up"       // leveled up
  | "evolution"      // triggered evolution
  | "no_pp"          // move has no PP left, use Struggle
  | "missed";        // move missed (accuracy < 100)

export interface BattleEvent {
  kind: BattleEventKind;
  text: string;
  /** Which side: "player" | "enemy" */
  side?: "player" | "enemy";
  /** For damage events: amount dealt */
  damage?: number;
  /** For xp_gained: amount */
  xp?: number;
  /** For level_up: new level */
  newLevel?: number;
  /** For evolution: target Pokemon ID */
  evolutionTargetId?: number;
}

export interface TurnResult {
  playerPokemon: OwnedPokemon;
  enemyPokemon: OwnedPokemon;
  events: BattleEvent[];
  /** Did the battle end this turn? */
  battleOver: boolean;
  winner: "player" | "enemy" | null;
  /** True if player fled successfully */
  fled: boolean;
}

// ─── Move resolution ──────────────────────────────────────────────────────────

function moveHits(accuracy: number | null): boolean {
  if (accuracy === null) return true; // always-hit moves
  return Math.random() * 100 < accuracy;
}

function applyMove(
  attacker: OwnedPokemon,
  defender: OwnedPokemon,
  moveIndex: number,
  side: "player" | "enemy",
  events: BattleEvent[]
): { attacker: OwnedPokemon; defender: OwnedPokemon } {
  const move = attacker.moves[moveIndex];
  if (!move) return { attacker, defender };

  // Deduct PP (even on miss)
  const updatedMoves = attacker.moves.map((m, i) =>
    i === moveIndex
      ? { ...m, currentPp: Math.max(0, m.currentPp - 1) }
      : m
  );
  const updatedAttacker = { ...attacker, moves: updatedMoves };

  const moveName = move.name;
  events.push({ kind: "move_used", text: `${formatName(attacker.nickname)} used ${moveName}!`, side });

  // Status moves — no damage (simplified: just say "nothing happened")
  if (!move.power || move.power <= 0) {
    events.push({ kind: "move_used", text: "But it had no effect on HP...", side });
    return { attacker: updatedAttacker, defender };
  }

  // Accuracy check
  const accuracy = (move as { accuracy?: number | null }).accuracy ?? null;
  if (!moveHits(accuracy)) {
    events.push({ kind: "missed", text: `${formatName(attacker.nickname)}'s attack missed!`, side });
    return { attacker: updatedAttacker, defender };
  }

  // Damage calculation
  const result = calculateDamage(
    attacker.level,
    move.power,
    move.type,
    move.damageClass,
    attacker.stats,
    defender.stats,
    defender.species.types
  );

  // Effectiveness message
  if (result.effectiveness === "immune") {
    events.push({ kind: "effectiveness", text: `It doesn't affect ${formatName(defender.nickname)}!`, side });
    return { attacker: updatedAttacker, defender };
  }
  if (result.effectiveness === "super") {
    events.push({ kind: "effectiveness", text: "It's super effective!", side });
  } else if (result.effectiveness === "weak") {
    events.push({ kind: "effectiveness", text: "It's not very effective...", side });
  }
  if (result.isCritical) {
    events.push({ kind: "critical", text: "A critical hit!", side });
  }

  const newHp = Math.max(0, defender.currentHp - result.damage);
  const updatedDefender = { ...defender, currentHp: newHp };

  events.push({
    kind: "damage",
    text: `${formatName(defender.nickname)} took ${result.damage} damage!`,
    side,
    damage: result.damage,
  });

  return { attacker: updatedAttacker, defender: updatedDefender };
}

// ─── AI move picker ───────────────────────────────────────────────────────────

/**
 * Simple AI: prefer moves with PP > 0, then pick the one with best type matchup.
 * Ties broken by raw power. Falls back to Struggle if all PP exhausted.
 */
export function aiPickMoveIndex(
  enemy: OwnedPokemon,
  playerPokemon: OwnedPokemon
): number {
  const playerTypes = playerPokemon.species.types;

  // Score each move
  const scored = enemy.moves
    .map((move, index) => {
      if (move.currentPp <= 0) return { index, score: -1 };
      if (!move.power || move.power <= 0) return { index, score: 0 };

      // Type effectiveness bonus
      let typeBonus = 1;
      for (const defType of playerTypes) {
        const eff = TYPE_EFFECTIVENESS[move.type]?.[defType];
        if (eff !== undefined) typeBonus *= eff;
      }

      const score = move.power * typeBonus;
      return { index, score };
    })
    .filter((s) => s.score >= 0)
    .sort((a, b) => b.score - a.score);

  return scored.length > 0 ? scored[0].index : 0; // fallback index 0
}

// ─── Flee logic ───────────────────────────────────────────────────────────────

/**
 * Flee probability: based on speed comparison.
 * Higher player speed relative to enemy = easier to flee.
 */
export function canFlee(playerPokemon: OwnedPokemon, enemyPokemon: OwnedPokemon): boolean {
  const playerSpeed = playerPokemon.stats.find((s) => s.name === "speed")?.value ?? 50;
  const enemySpeed = enemyPokemon.stats.find((s) => s.name === "speed")?.value ?? 50;
  const ratio = playerSpeed / Math.max(enemySpeed, 1);
  const probability = Math.min(0.95, 0.5 + (ratio - 1) * 0.3);
  return Math.random() < probability;
}

// ─── Main turn resolver ───────────────────────────────────────────────────────

/**
 * Resolve a full turn: player uses moveIndex, AI responds.
 * Returns updated Pokemon state and all events for the UI to display sequentially.
 */
export function resolveTurn(
  playerPokemon: OwnedPokemon,
  enemyPokemon: OwnedPokemon,
  playerMoveIndex: number
): TurnResult {
  const events: BattleEvent[] = [];
  let player = { ...playerPokemon };
  let enemy = { ...enemyPokemon };
  let battleOver = false;
  let winner: "player" | "enemy" | null = null;

  // Determine turn order by speed
  const playerSpeed = player.stats.find((s) => s.name === "speed")?.value ?? 50;
  const enemySpeed = enemy.stats.find((s) => s.name === "speed")?.value ?? 50;
  const playerGoesFirst = playerSpeed >= enemySpeed;

  const aiMoveIndex = aiPickMoveIndex(enemy, player);

  if (playerGoesFirst) {
    // Player attacks first
    const { attacker, defender } = applyMove(player, enemy, playerMoveIndex, "player", events);
    player = attacker;
    enemy = defender;

    if (enemy.currentHp <= 0) {
      events.push({ kind: "ko", text: `${formatName(enemy.nickname)} fainted!`, side: "enemy" });
      battleOver = true;
      winner = "player";
    } else {
      // Enemy attacks
      const r2 = applyMove(enemy, player, aiMoveIndex, "enemy", events);
      enemy = r2.attacker;
      player = r2.defender;
      if (player.currentHp <= 0) {
        events.push({ kind: "ko", text: `${formatName(player.nickname)} fainted!`, side: "player" });
        battleOver = true;
        winner = "enemy";
      }
    }
  } else {
    // Enemy attacks first
    const { attacker, defender } = applyMove(enemy, player, aiMoveIndex, "enemy", events);
    enemy = attacker;
    player = defender;

    if (player.currentHp <= 0) {
      events.push({ kind: "ko", text: `${formatName(player.nickname)} fainted!`, side: "player" });
      battleOver = true;
      winner = "enemy";
    } else {
      // Player attacks
      const r2 = applyMove(player, enemy, playerMoveIndex, "player", events);
      player = r2.attacker;
      enemy = r2.defender;
      if (enemy.currentHp <= 0) {
        events.push({ kind: "ko", text: `${formatName(enemy.nickname)} fainted!`, side: "enemy" });
        battleOver = true;
        winner = "player";
      }
    }
  }

  return { playerPokemon: player, enemyPokemon: enemy, events, battleOver, winner, fled: false };
}

/** Attempt to flee. Returns a TurnResult with fled=true on success. */
export function attemptFlee(
  playerPokemon: OwnedPokemon,
  enemyPokemon: OwnedPokemon
): TurnResult {
  const events: BattleEvent[] = [];
  const success = canFlee(playerPokemon, enemyPokemon);

  if (success) {
    events.push({ kind: "flee_success", text: "Got away safely!" });
    return { playerPokemon, enemyPokemon, events, battleOver: true, winner: null, fled: true };
  } else {
    events.push({ kind: "flee_fail", text: "Can't escape!" });
    // Enemy still gets to attack on a failed flee
    const aiMoveIndex = aiPickMoveIndex(enemyPokemon, playerPokemon);
    const { attacker, defender } = applyMove(enemyPokemon, playerPokemon, aiMoveIndex, "enemy", events);
    const newPlayer = defender;
    let battleOver = false;
    let winner: "player" | "enemy" | null = null;
    if (newPlayer.currentHp <= 0) {
      events.push({ kind: "ko", text: `${formatName(newPlayer.nickname)} fainted!`, side: "player" });
      battleOver = true;
      winner = "enemy";
    }
    return { playerPokemon: newPlayer, enemyPokemon: attacker, events, battleOver, winner, fled: false };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatName(name: string): string {
  return name
    .split(/[-\s]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export { formatName };

// ─── Wild Pokemon factory for battles ────────────────────────────────────────

/**
 * Build a battle-ready OwnedPokemon for a wild opponent from a LocalPokemon.
 * Wild Pokemon have simplified synthetic moves (no instance ID needed).
 */
export function buildWildBattlePokemon(
  species: { id: number; name: string; types: string[]; sprite: string | null; artwork: string | null; stats: { name: string; base_stat: number }[] },
  level: number
): OwnedPokemon {
  const stats = species.stats.map((s: { name: string; base_stat: number }) => ({
    name: s.name,
    value: calcStat(s.name, s.base_stat, level),
  }));
  const maxHp = stats.find((s: { name: string }) => s.name === "hp")?.value ?? 30;

  const typeMove = (type: string, power: number, pp: number) => ({
    id: 0, name: `${type.charAt(0).toUpperCase()}${type.slice(1)} Attack`,
    type, power, pp, damageClass: "physical" as const, currentPp: pp,
  });

  const moves = species.types.map((t, i) => typeMove(t, 40 + i * 10, 20));
  if (moves.length < 4) moves.push(typeMove("normal", 35, 35));

  return {
    instanceId: `wild-${species.id}-${Date.now()}`,
    pokemonId: species.id,
    nickname: species.name,
    level,
    xp: 0,
    xpToNextLevel: 0,
    currentHp: maxHp,
    maxHp,
    stats,
    moves: moves.slice(0, 4),
    species: {
      id: species.id,
      name: species.name,
      types: species.types,
      sprite: species.sprite,
      artwork: species.artwork,
      baseStats: species.stats,
      evolutionChain: [],
    },
    caughtInArea: "wild",
    caughtAt: new Date().toISOString(),
  };
}
