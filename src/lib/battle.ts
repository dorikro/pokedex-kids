/**
 * Turn-based battle engine — v0.2.4
 *
 * Pure functions only. No state, no side effects.
 *
 * New in v0.2.4:
 *  - Status conditions: poison, burn, sleep, paralysis, freeze
 *  - Per-turn status processing (tick damage, skip chance)
 *  - Status application from moves (pure-status and side-effect chance)
 *  - resolveEnemyOnly() for voluntary-switch retaliation
 *  - Catch rate bonus for sleep/freeze status
 */

import { calculateDamage, calcStat } from "./player-state";
import { TYPE_EFFECTIVENESS } from "./constants";
import { STATUS_MOVE_DATA, getStatusMoveForType } from "./status-moves";
import type { OwnedPokemon, StatusCondition } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BattleEventKind =
  | "move_used"
  | "damage"
  | "effectiveness"
  | "critical"
  | "ko"
  | "flee_success"
  | "flee_fail"
  | "xp_gained"
  | "level_up"
  | "evolution"
  | "no_pp"
  | "missed"
  | "status_applied"   // a status condition was inflicted
  | "status_tick"      // end-of-turn status damage (poison / burn)
  | "status_cured"     // status wore off naturally (sleep woke up, freeze thawed)
  | "cant_move";       // skipped turn due to status

export interface BattleEvent {
  kind: BattleEventKind;
  text: string;
  side?: "player" | "enemy";
  damage?: number;
  xp?: number;
  newLevel?: number;
  evolutionTargetId?: number;
}

export interface TurnResult {
  playerPokemon: OwnedPokemon;
  enemyPokemon: OwnedPokemon;
  events: BattleEvent[];
  battleOver: boolean;
  winner: "player" | "enemy" | null;
  fled: boolean;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

/** Display label used in event messages. */
const STATUS_LABEL: Record<StatusCondition, string> = {
  poison:    "poisoned",
  burn:      "burned",
  sleep:     "fell asleep",
  paralysis: "paralysed",
  freeze:    "frozen solid",
};

const STATUS_TICK_LABEL: Record<string, string> = {
  poison: "hurt by poison",
  burn:   "hurt by burn",
};

/**
 * Process a Pokémon's status condition at the START of its turn.
 * Returns updated Pokémon and whether it can actually move this turn.
 */
function processStatus(
  pokemon: OwnedPokemon,
  side: "player" | "enemy",
  events: BattleEvent[]
): { pokemon: OwnedPokemon; canMove: boolean } {
  if (!pokemon.statusCondition) return { pokemon, canMove: true };

  let p = { ...pokemon };
  let canMove = true;

  switch (p.statusCondition) {
    case "sleep": {
      if (p.statusTurnsLeft > 0) {
        canMove = false;
        p = { ...p, statusTurnsLeft: p.statusTurnsLeft - 1 };
        events.push({ kind: "cant_move", text: `${formatName(p.nickname)} is fast asleep!`, side });
        if (p.statusTurnsLeft === 0) {
          p = { ...p, statusCondition: null };
          events.push({ kind: "status_cured", text: `${formatName(p.nickname)} woke up!`, side });
          canMove = false; // woke up this turn — still skips
        }
      }
      break;
    }
    case "freeze": {
      // 20% chance to thaw each turn
      const thawed = Math.random() < 0.2;
      if (thawed) {
        p = { ...p, statusCondition: null, statusTurnsLeft: 0 };
        events.push({ kind: "status_cured", text: `${formatName(p.nickname)} thawed out!`, side });
        canMove = true;
      } else {
        canMove = false;
        events.push({ kind: "cant_move", text: `${formatName(p.nickname)} is frozen solid!`, side });
      }
      break;
    }
    case "paralysis": {
      // 25% chance to be fully paralysed
      const fullyParalysed = Math.random() < 0.25;
      if (fullyParalysed) {
        canMove = false;
        events.push({ kind: "cant_move", text: `${formatName(p.nickname)} is paralysed and can't move!`, side });
      }
      break;
    }
    case "poison":
    case "burn": {
      // Damage applied at END of turn, not here — just allow movement
      canMove = true;
      break;
    }
  }

  return { pokemon: p, canMove };
}

/**
 * Apply end-of-turn status tick damage (poison / burn).
 * Called after both attacks have resolved.
 */
function applyStatusTick(
  pokemon: OwnedPokemon,
  side: "player" | "enemy",
  events: BattleEvent[]
): OwnedPokemon {
  if (pokemon.statusCondition !== "poison" && pokemon.statusCondition !== "burn") return pokemon;

  const tickDmg = pokemon.statusCondition === "poison"
    ? Math.max(1, Math.floor(pokemon.maxHp / 8))   // 12.5% maxHp
    : Math.max(1, Math.floor(pokemon.maxHp / 16));  // 6.25% maxHp

  const newHp = Math.max(0, pokemon.currentHp - tickDmg);
  events.push({
    kind: "status_tick",
    text: `${formatName(pokemon.nickname)} is ${STATUS_TICK_LABEL[pokemon.statusCondition]}! (−${tickDmg} HP)`,
    side,
    damage: tickDmg,
  });

  return { ...pokemon, currentHp: newHp };
}

/**
 * Try to apply a status condition to a Pokémon.
 * Fails silently if: target already has a status, or immune (same type as move).
 */
function tryApplyStatus(
  target: OwnedPokemon,
  ailment: StatusCondition,
  ailmentChance: number,
  side: "player" | "enemy",
  events: BattleEvent[]
): OwnedPokemon {
  // Already has a status — can't stack
  if (target.statusCondition) return target;

  // Electric-type Pokémon are immune to paralysis
  if (ailment === "paralysis" && target.species.types.includes("electric")) return target;
  // Fire-type Pokémon are immune to burn
  if (ailment === "burn" && target.species.types.includes("fire")) return target;
  // Ice-type Pokémon are immune to freeze
  if (ailment === "freeze" && target.species.types.includes("ice")) return target;
  // Poison/Steel-type Pokémon are immune to poison
  if (ailment === "poison" &&
    (target.species.types.includes("poison") || target.species.types.includes("steel"))) return target;

  if (Math.random() * 100 >= ailmentChance) return target;

  // Duration: sleep 1–3 turns, freeze 1–5 turns, others permanent (0)
  const turnsLeft = ailment === "sleep"  ? Math.floor(Math.random() * 3) + 1
                  : ailment === "freeze" ? Math.floor(Math.random() * 5) + 1
                  : 0;

  events.push({
    kind: "status_applied",
    text: `${formatName(target.nickname)} ${STATUS_LABEL[ailment]}!`,
    side,
  });

  return { ...target, statusCondition: ailment, statusTurnsLeft: turnsLeft };
}

// ─── Move resolution ──────────────────────────────────────────────────────────

function moveHits(accuracy: number | null): boolean {
  if (accuracy === null) return true;
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

  // Deduct PP
  const updatedMoves = attacker.moves.map((m, i) =>
    i === moveIndex ? { ...m, currentPp: Math.max(0, m.currentPp - 1) } : m
  );
  const updatedAttacker = { ...attacker, moves: updatedMoves };

  events.push({ kind: "move_used", text: `${formatName(attacker.nickname)} used ${move.name}!`, side });

  // Pure status move (no damage)
  if (move.damageClass === "status" || (!move.power || move.power <= 0)) {
    const accuracy = (move as { accuracy?: number | null }).accuracy ?? null;
    if (!moveHits(accuracy)) {
      events.push({ kind: "missed", text: `${formatName(attacker.nickname)}'s attack missed!`, side });
      return { attacker: updatedAttacker, defender };
    }
    if (move.ailment && move.ailmentChance) {
      const newDefender = tryApplyStatus(defender, move.ailment, move.ailmentChance, side, events);
      return { attacker: updatedAttacker, defender: newDefender };
    }
    events.push({ kind: "move_used", text: "But nothing happened…", side });
    return { attacker: updatedAttacker, defender };
  }

  // Accuracy check for damaging moves
  const accuracy = (move as { accuracy?: number | null }).accuracy ?? null;
  if (!moveHits(accuracy)) {
    events.push({ kind: "missed", text: `${formatName(attacker.nickname)}'s attack missed!`, side });
    return { attacker: updatedAttacker, defender };
  }

  // Damage
  const result = calculateDamage(
    attacker.level,
    move.power,
    move.type,
    move.damageClass,
    attacker.stats,
    defender.stats,
    defender.species.types
  );

  if (result.effectiveness === "immune") {
    events.push({ kind: "effectiveness", text: `It doesn't affect ${formatName(defender.nickname)}!`, side });
    return { attacker: updatedAttacker, defender };
  }
  if (result.effectiveness === "super") events.push({ kind: "effectiveness", text: "It's super effective!", side });
  else if (result.effectiveness === "weak") events.push({ kind: "effectiveness", text: "It's not very effective…", side });
  if (result.isCritical) events.push({ kind: "critical", text: "A critical hit!", side });

  const newHp = Math.max(0, defender.currentHp - result.damage);
  events.push({ kind: "damage", text: `${formatName(defender.nickname)} took ${result.damage} damage!`, side, damage: result.damage });
  let updatedDefender = { ...defender, currentHp: newHp };

  // Side-effect status chance (e.g. Flamethrower 10% burn)
  if (newHp > 0 && move.ailment && (move.ailmentChance ?? 0) > 0) {
    updatedDefender = tryApplyStatus(updatedDefender, move.ailment, move.ailmentChance!, side, events);
  }

  return { attacker: updatedAttacker, defender: updatedDefender };
}

// ─── AI move picker ───────────────────────────────────────────────────────────

export function aiPickMoveIndex(enemy: OwnedPokemon, playerPokemon: OwnedPokemon): number {
  const playerTypes = playerPokemon.species.types;
  const scored = enemy.moves
    .map((move, index) => {
      if (move.currentPp <= 0) return { index, score: -1 };
      if (!move.power || move.power <= 0) {
        // Status moves: useful only if player doesn't already have that status
        if (move.ailment && !playerPokemon.statusCondition) return { index, score: 30 };
        return { index, score: 0 };
      }
      let typeBonus = 1;
      for (const defType of playerTypes) {
        const eff = TYPE_EFFECTIVENESS[move.type]?.[defType];
        if (eff !== undefined) typeBonus *= eff;
      }
      return { index, score: move.power * typeBonus };
    })
    .filter((s) => s.score >= 0)
    .sort((a, b) => b.score - a.score);

  return scored.length > 0 ? scored[0].index : 0;
}

// ─── Flee logic ───────────────────────────────────────────────────────────────

export function canFlee(playerPokemon: OwnedPokemon, enemyPokemon: OwnedPokemon): boolean {
  // Paralysed players have reduced flee chance
  const paralysedPenalty = playerPokemon.statusCondition === "paralysis" ? 0.5 : 1;
  const playerSpeed = (playerPokemon.stats.find((s) => s.name === "speed")?.value ?? 50) * paralysedPenalty;
  const enemySpeed = enemyPokemon.stats.find((s) => s.name === "speed")?.value ?? 50;
  const ratio = playerSpeed / Math.max(enemySpeed, 1);
  const probability = Math.min(0.95, 0.5 + (ratio - 1) * 0.3);
  return Math.random() < probability;
}

// ─── Main turn resolver ───────────────────────────────────────────────────────

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

  const playerSpeed = player.stats.find((s) => s.name === "speed")?.value ?? 50;
  const enemySpeed = enemy.stats.find((s) => s.name === "speed")?.value ?? 50;
  // Paralysed speed halved
  const effectivePlayerSpeed = player.statusCondition === "paralysis" ? playerSpeed / 2 : playerSpeed;
  const playerGoesFirst = effectivePlayerSpeed >= enemySpeed;

  const aiMoveIndex = aiPickMoveIndex(enemy, player);

  // ── Turn order ─────────────────────────────────────────────────────────────

  if (playerGoesFirst) {
    // Player's turn
    const { pokemon: p1, canMove: p1CanMove } = processStatus(player, "player", events);
    player = p1;
    if (p1CanMove) {
      const r = applyMove(player, enemy, playerMoveIndex, "player", events);
      player = r.attacker; enemy = r.defender;
    }
    if (enemy.currentHp <= 0) {
      events.push({ kind: "ko", text: `${formatName(enemy.nickname)} fainted!`, side: "enemy" });
      // Still apply player's status tick even on KO turn
      player = applyStatusTick(player, "player", events);
      return { playerPokemon: player, enemyPokemon: enemy, events, battleOver: true, winner: "player", fled: false };
    }

    // Enemy's turn
    const { pokemon: e1, canMove: e1CanMove } = processStatus(enemy, "enemy", events);
    enemy = e1;
    if (e1CanMove) {
      const r = applyMove(enemy, player, aiMoveIndex, "enemy", events);
      enemy = r.attacker; player = r.defender;
    }
    if (player.currentHp <= 0) {
      events.push({ kind: "ko", text: `${formatName(player.nickname)} fainted!`, side: "player" });
      battleOver = true; winner = "enemy";
    }
  } else {
    // Enemy's turn first
    const { pokemon: e1, canMove: e1CanMove } = processStatus(enemy, "enemy", events);
    enemy = e1;
    if (e1CanMove) {
      const r = applyMove(enemy, player, aiMoveIndex, "enemy", events);
      enemy = r.attacker; player = r.defender;
    }
    if (player.currentHp <= 0) {
      events.push({ kind: "ko", text: `${formatName(player.nickname)} fainted!`, side: "player" });
      enemy = applyStatusTick(enemy, "enemy", events);
      return { playerPokemon: player, enemyPokemon: enemy, events, battleOver: true, winner: "enemy", fled: false };
    }

    // Player's turn
    const { pokemon: p1, canMove: p1CanMove } = processStatus(player, "player", events);
    player = p1;
    if (p1CanMove) {
      const r = applyMove(player, enemy, playerMoveIndex, "player", events);
      player = r.attacker; enemy = r.defender;
    }
    if (enemy.currentHp <= 0) {
      events.push({ kind: "ko", text: `${formatName(enemy.nickname)} fainted!`, side: "enemy" });
      battleOver = true; winner = "player";
    }
  }

  // End-of-turn status tick (both sides, if still alive)
  if (!battleOver) {
    player = applyStatusTick(player, "player", events);
    if (player.currentHp <= 0) {
      events.push({ kind: "ko", text: `${formatName(player.nickname)} fainted from status!`, side: "player" });
      battleOver = true; winner = "enemy";
    }
    if (!battleOver) {
      enemy = applyStatusTick(enemy, "enemy", events);
      if (enemy.currentHp <= 0) {
        events.push({ kind: "ko", text: `${formatName(enemy.nickname)} fainted from status!`, side: "enemy" });
        battleOver = true; winner = "player";
      }
    }
  }

  return { playerPokemon: player, enemyPokemon: enemy, events, battleOver, winner, fled: false };
}

/**
 * Resolve only the enemy's retaliatory attack — used when the player
 * voluntarily switches Pokémon (costs a turn).
 */
export function resolveEnemyOnly(
  enemy: OwnedPokemon,
  player: OwnedPokemon
): TurnResult {
  const events: BattleEvent[] = [];
  let p = { ...player };
  let e = { ...enemy };

  const { pokemon: e1, canMove } = processStatus(e, "enemy", events);
  e = e1;
  if (canMove) {
    const aiIdx = aiPickMoveIndex(e, p);
    const r = applyMove(e, p, aiIdx, "enemy", events);
    e = r.attacker; p = r.defender;
  }

  let battleOver = false;
  let winner: "player" | "enemy" | null = null;

  if (p.currentHp <= 0) {
    events.push({ kind: "ko", text: `${formatName(p.nickname)} fainted!`, side: "player" });
    battleOver = true; winner = "enemy";
  } else {
    // End-of-turn ticks
    p = applyStatusTick(p, "player", events);
    if (p.currentHp <= 0) {
      events.push({ kind: "ko", text: `${formatName(p.nickname)} fainted from status!`, side: "player" });
      battleOver = true; winner = "enemy";
    }
    e = applyStatusTick(e, "enemy", events);
  }

  return { playerPokemon: p, enemyPokemon: e, events, battleOver, winner, fled: false };
}

/** Attempt to flee. */
export function attemptFlee(playerPokemon: OwnedPokemon, enemyPokemon: OwnedPokemon): TurnResult {
  const events: BattleEvent[] = [];
  const success = canFlee(playerPokemon, enemyPokemon);

  if (success) {
    events.push({ kind: "flee_success", text: "Got away safely!" });
    return { playerPokemon, enemyPokemon, events, battleOver: true, winner: null, fled: true };
  }

  events.push({ kind: "flee_fail", text: "Can't escape!" });
  const aiMoveIndex = aiPickMoveIndex(enemyPokemon, playerPokemon);
  const { attacker, defender } = applyMove(enemyPokemon, playerPokemon, aiMoveIndex, "enemy", events);
  let newPlayer = defender;
  let battleOver = false;
  let winner: "player" | "enemy" | null = null;
  if (newPlayer.currentHp <= 0) {
    events.push({ kind: "ko", text: `${formatName(newPlayer.nickname)} fainted!`, side: "player" });
    battleOver = true; winner = "enemy";
  }
  return { playerPokemon: newPlayer, enemyPokemon: attacker, events, battleOver, winner, fled: false };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatName(name: string): string {
  return name.split(/[-\s]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
export { formatName };

// ─── Wild Pokemon factory ─────────────────────────────────────────────────────

export function buildWildBattlePokemon(
  species: { id: number; name: string; types: string[]; sprite: string | null; artwork: string | null; stats: { name: string; base_stat: number }[] },
  level: number
): OwnedPokemon {
  const stats = species.stats.map((s) => ({
    name: s.name,
    value: calcStat(s.name, s.base_stat, level),
  }));
  const maxHp = stats.find((s) => s.name === "hp")?.value ?? 30;

  const typeMove = (type: string, power: number, pp: number, id = 0) => ({
    id, name: `${type.charAt(0).toUpperCase()}${type.slice(1)} Attack`,
    type, power, pp, damageClass: "physical" as const, currentPp: pp,
    ailment: STATUS_MOVE_DATA[id]?.ailment ?? null,
    ailmentChance: STATUS_MOVE_DATA[id]?.ailmentChance ?? 0,
  });

  // Up to 3 damaging moves (one per type) + 1 status move if the primary type has one
  const damagingMoves = species.types.map((t, i) => typeMove(t, 40 + i * 10, 20));
  if (damagingMoves.length < 2) damagingMoves.push(typeMove("normal", 35, 35));

  const statusMove = getStatusMoveForType(species.types[0]);
  const moves = statusMove
    ? [...damagingMoves.slice(0, 3), statusMove]
    : [...damagingMoves.slice(0, 4)];

  return {
    instanceId: `wild-${species.id}-${Date.now()}`,
    pokemonId: species.id,
    nickname: species.name,
    level,
    xp: 0,
    xpToNextLevel: 0,
    currentHp: maxHp,
    maxHp,
    statusCondition: null,
    statusTurnsLeft: 0,
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
