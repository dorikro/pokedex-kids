"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { resolveTurn, attemptFlee, buildWildBattlePokemon } from "@/lib/battle";
import { playerState, applyRealMoves, awardXp, xpReward } from "@/lib/player-state";
import { getArea } from "@/lib/areas";
import { pickWildPokemonId, pickWildLevel } from "@/lib/catch";
import { fetchPokemonDetail, formatPokemonName } from "@/lib/api-client";
import { useTranslation } from "@/lib/i18n/index";
import TypeBadge from "@/components/TypeBadge";
import type { OwnedPokemon, PlayerState } from "@/lib/types";
import type { BattleEvent } from "@/lib/battle";

// ─── HP bar ──────────────────────────────────────────────────────────────────

function HpBar({
  current, max, animate,
}: { current: number; max: number; animate?: boolean }) {
  const pct = Math.max(0, Math.min((current / max) * 100, 100));
  const color = pct > 50 ? "bg-green-400" : pct > 20 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>HP</span>
        <span className="font-mono">{current}/{max}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} ${animate ? "transition-all duration-700" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Pokemon battle card ──────────────────────────────────────────────────────

function BattleCard({
  pokemon, side, shaking,
}: { pokemon: OwnedPokemon; side: "player" | "enemy"; shaking: boolean }) {
  const { t } = useTranslation();
  const isPlayer = side === "player";

  return (
    <div className={`flex flex-col gap-2 ${isPlayer ? "items-start" : "items-end"}`}>
      {/* Name + level */}
      <div className={`flex items-center gap-2 ${isPlayer ? "" : "flex-row-reverse"}`}>
        <span className="font-bold text-gray-800">{formatPokemonName(pokemon.nickname)}</span>
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
          {t.game.level} {pokemon.level}
        </span>
      </div>

      {/* Types */}
      <div className={`flex gap-1 ${isPlayer ? "" : "flex-row-reverse"}`}>
        {pokemon.species.types.map((type) => (
          <TypeBadge key={type} type={type} />
        ))}
      </div>

      {/* Sprite */}
      <div className={`${shaking ? "animate-bounce" : ""}`}>
        {(isPlayer ? pokemon.species.artwork : pokemon.species.sprite) ? (
          <img
            src={isPlayer ? (pokemon.species.artwork ?? pokemon.species.sprite ?? "") : (pokemon.species.sprite ?? "")}
            alt={formatPokemonName(pokemon.nickname)}
            width={isPlayer ? 100 : 80}
            height={isPlayer ? 100 : 80}
            className={`${isPlayer ? "w-24 h-24" : "w-20 h-20"} object-contain drop-shadow-md ${!isPlayer ? "image-rendering-pixelated" : ""}`}
          />
        ) : (
          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300">?</div>
        )}
      </div>

      {/* HP bar */}
      <div className="w-36 sm:w-44">
        <HpBar current={pokemon.currentHp} max={pokemon.maxHp} animate />
      </div>
    </div>
  );
}

// ─── Move button ──────────────────────────────────────────────────────────────

const TYPE_BTN_COLORS: Record<string, string> = {
  normal: "bg-stone-100 border-stone-300 text-stone-700 hover:bg-stone-200",
  fire: "bg-red-50 border-red-300 text-red-700 hover:bg-red-100",
  water: "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100",
  electric: "bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100",
  grass: "bg-green-50 border-green-300 text-green-700 hover:bg-green-100",
  ice: "bg-cyan-50 border-cyan-300 text-cyan-700 hover:bg-cyan-100",
  fighting: "bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100",
  poison: "bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100",
  ground: "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100",
  flying: "bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100",
  psychic: "bg-pink-50 border-pink-300 text-pink-700 hover:bg-pink-100",
  bug: "bg-lime-50 border-lime-300 text-lime-700 hover:bg-lime-100",
  rock: "bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200",
  ghost: "bg-violet-50 border-violet-300 text-violet-700 hover:bg-violet-100",
  dragon: "bg-indigo-100 border-indigo-400 text-indigo-800 hover:bg-indigo-200",
  dark: "bg-gray-200 border-gray-400 text-gray-700 hover:bg-gray-300",
  steel: "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200",
  fairy: "bg-pink-50 border-pink-300 text-pink-700 hover:bg-pink-100",
};

function MoveButton({
  move, index, disabled, onClick,
}: {
  move: OwnedPokemon["moves"][0];
  index: number;
  disabled: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const colors = TYPE_BTN_COLORS[move.type] ?? TYPE_BTN_COLORS.normal;
  const noPP = move.currentPp <= 0;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 min-w-[calc(50%-4px)] border rounded-xl p-3 text-left transition-all
        ${disabled ? "opacity-40 cursor-not-allowed bg-gray-50 border-gray-200" : colors}
      `}
      type="button"
    >
      <div className="flex justify-between items-start gap-1">
        <span className="font-semibold text-sm leading-tight">{move.name}</span>
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${noPP ? "bg-red-50 border-red-200 text-red-500" : "bg-white/60 border-current"}`}>
          {move.currentPp}/{move.pp} {t.battle.pp}
        </span>
      </div>
      <div className="flex gap-2 mt-1 text-[10px] opacity-70">
        <span className="capitalize">{move.type}</span>
        {move.power && <span>· {move.power} pwr</span>}
      </div>
    </button>
  );
}

// ─── Event log ────────────────────────────────────────────────────────────────

function EventLog({ events }: { events: BattleEvent[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 h-28 overflow-y-auto text-sm space-y-1">
      {events.map((e, i) => (
        <p
          key={i}
          className={
            e.kind === "ko" ? "font-bold text-red-600"
            : e.kind === "level_up" ? "font-bold text-blue-600"
            : e.kind === "critical" ? "font-semibold text-yellow-600"
            : e.kind === "effectiveness" && e.text.includes("super") ? "font-semibold text-green-600"
            : e.kind === "flee_success" ? "font-semibold text-gray-500"
            : "text-gray-700"
          }
        >
          {e.text}
        </p>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

// ─── Battle state machine ─────────────────────────────────────────────────────

type BattlePhase = "loading" | "player_turn" | "animating" | "battle_over" | "no_party";

// ─── Main battle page ─────────────────────────────────────────────────────────

export default function BattlePage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [phase, setPhase] = useState<BattlePhase>("loading");
  const [playerPokemon, setPlayerPokemon] = useState<OwnedPokemon | null>(null);
  const [enemyPokemon, setEnemyPokemon] = useState<OwnedPokemon | null>(null);
  const [eventLog, setEventLog] = useState<BattleEvent[]>([]);
  const [winner, setWinner] = useState<"player" | "enemy" | null>(null);
  const [savedState, setSavedState] = useState<PlayerState | null>(null);
  const [playerShaking, setPlayerShaking] = useState(false);
  const [enemyShaking, setEnemyShaking] = useState(false);

  // Load player party Pokemon + generate wild opponent
  useEffect(() => {
    async function init() {
      const save = playerState.get();
      setSavedState(save);

      if (!save.hasStarted || save.party.length === 0) {
        setPhase("no_party");
        return;
      }

      // Load real moves for lead Pokemon
      let lead = save.party[0];
      try {
        const res = await fetch(`/api/moves/${lead.species.id}`);
        if (res.ok) {
          const { moves } = await res.json();
          if (moves?.length) lead = applyRealMoves(lead, moves);
        }
      } catch { /* use synthetic moves */ }

      // Generate wild opponent
      try {
        const area = getArea(save.currentAreaId);
        const wildId = pickWildPokemonId(area);
        const wildLevel = pickWildLevel(area);
        const wildSpecies = await fetchPokemonDetail(String(wildId));

        const wildPokemon = buildWildBattlePokemon(
          {
            id: wildSpecies.id,
            name: wildSpecies.name,
            types: wildSpecies.types,
            sprite: wildSpecies.sprite,
            artwork: wildSpecies.artwork,
            stats: wildSpecies.stats,
          },
          wildLevel
        );

        setPlayerPokemon(lead);
        setEnemyPokemon(wildPokemon);
        setEventLog([{
          kind: "move_used",
          text: t.battle.wildBattleTitle(formatPokemonName(wildSpecies.name)),
        }]);
        setPhase("player_turn");
      } catch (err) {
        console.error(err);
        setPhase("no_party");
      }
    }
    init();
  }, [t]);

  const handleMoveSelect = useCallback((moveIndex: number) => {
    if (!playerPokemon || !enemyPokemon || phase !== "player_turn") return;
    setPhase("animating");

    const result = resolveTurn(playerPokemon, enemyPokemon, moveIndex);

    // Trigger shake animations based on who took damage
    const playerHurt = result.playerPokemon.currentHp < playerPokemon.currentHp;
    const enemyHurt = result.enemyPokemon.currentHp < enemyPokemon.currentHp;
    if (playerHurt) { setPlayerShaking(true); setTimeout(() => setPlayerShaking(false), 600); }
    if (enemyHurt) { setEnemyShaking(true); setTimeout(() => setEnemyShaking(false), 600); }

    setPlayerPokemon(result.playerPokemon);
    setEnemyPokemon(result.enemyPokemon);
    setEventLog((prev) => [...prev, ...result.events]);

    if (result.battleOver) {
      handleBattleEnd(result.playerPokemon, result.enemyPokemon, result.winner);
    } else {
      setTimeout(() => setPhase("player_turn"), 800);
    }
  }, [playerPokemon, enemyPokemon, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFlee = useCallback(() => {
    if (!playerPokemon || !enemyPokemon || phase !== "player_turn") return;
    setPhase("animating");

    const result = attemptFlee(playerPokemon, enemyPokemon);
    setPlayerPokemon(result.playerPokemon);
    setEnemyPokemon(result.enemyPokemon);
    setEventLog((prev) => [...prev, ...result.events]);

    if (result.battleOver) {
      if (result.fled) {
        setTimeout(() => router.push("/wild"), 1000);
      } else {
        handleBattleEnd(result.playerPokemon, result.enemyPokemon, result.winner);
      }
    } else {
      setTimeout(() => setPhase("player_turn"), 800);
    }
  }, [playerPokemon, enemyPokemon, phase, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBattleEnd = useCallback((
    finalPlayer: OwnedPokemon,
    finalEnemy: OwnedPokemon,
    battleWinner: "player" | "enemy" | null
  ) => {
    if (!savedState) return;
    const newEvents: BattleEvent[] = [];

    if (battleWinner === "player") {
      // Award XP to lead Pokemon
      const xp = xpReward(finalEnemy.level, false);
      const { state: newSave, result: levelResult } = playerState.awardBattleXp(savedState, 0, xp);
      setSavedState(newSave);

      newEvents.push({ kind: "xp_gained", text: t.battle.xpGained(formatPokemonName(finalPlayer.nickname), xp), xp });

      if (levelResult.levelsGained > 0) {
        newEvents.push({
          kind: "level_up",
          text: t.battle.levelUp(formatPokemonName(finalPlayer.nickname), levelResult.pokemon.level),
          newLevel: levelResult.pokemon.level,
        });
        setPlayerPokemon(levelResult.pokemon);
      }

      if (levelResult.evolved && levelResult.evolutionTargetId) {
        newEvents.push({
          kind: "evolution",
          text: t.battle.evolved(
            formatPokemonName(finalPlayer.nickname),
            `#${levelResult.evolutionTargetId}`
          ),
          evolutionTargetId: levelResult.evolutionTargetId,
        });
      }
    }

    setEventLog((prev) => [...prev, ...newEvents]);
    setWinner(battleWinner);
    setTimeout(() => setPhase("battle_over"), 1200);
  }, [savedState, t]);

  // ─── Render states ──────────────────────────────────────────────

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (phase === "no_party") {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">⚔️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">No Pokémon to battle with!</h1>
        <p className="text-gray-500 mb-6">You need at least one Pokémon in your party to battle.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/start" className="px-6 py-3 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition-colors">
            Start Game
          </Link>
          <Link href="/wild" className="px-6 py-3 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 transition-colors">
            Catch Pokémon
          </Link>
        </div>
      </div>
    );
  }

  if (!playerPokemon || !enemyPokemon) return null;

  const isAnimating = phase === "animating";
  const isBattleOver = phase === "battle_over";

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Battle!</h1>
        <Link href="/party" className="text-sm text-gray-400 hover:text-gray-600">← Party</Link>
      </div>

      {/* Arena */}
      <div className="bg-gradient-to-b from-sky-50 to-green-50 rounded-3xl border border-gray-200 p-6 mb-4">
        <div className="flex justify-between items-end">
          {/* Enemy (top-right) */}
          <div className="flex-1 flex justify-end">
            <BattleCard pokemon={enemyPokemon} side="enemy" shaking={enemyShaking} />
          </div>
        </div>

        {/* VS divider */}
        <div className="text-center my-2 text-2xl font-bold text-gray-200">—</div>

        <div className="flex justify-start">
          {/* Player (bottom-left) */}
          <BattleCard pokemon={playerPokemon} side="player" shaking={playerShaking} />
        </div>
      </div>

      {/* Event log */}
      <EventLog events={eventLog} />

      {/* Controls */}
      <div className="mt-4">
        {!isBattleOver && (
          <>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {isAnimating ? t.battle.enemyTurn : t.battle.yourTurn}
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {playerPokemon.moves.map((move, index) => (
                <MoveButton
                  key={index}
                  move={move}
                  index={index}
                  disabled={isAnimating}
                  onClick={() => handleMoveSelect(index)}
                />
              ))}
            </div>
            <button
              onClick={handleFlee}
              disabled={isAnimating}
              className="w-full py-2 rounded-xl bg-gray-100 text-gray-500 font-semibold text-sm hover:bg-gray-200 transition-colors disabled:opacity-40"
              type="button"
            >
              {t.battle.flee}
            </button>
          </>
        )}

        {isBattleOver && (
          <div className="text-center py-4">
            <p className={`text-xl font-bold mb-4 ${winner === "player" ? "text-green-600" : "text-red-500"}`}>
              {winner === "player" ? t.battle.playerWins : t.battle.enemyWins}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition-colors"
                type="button"
              >
                Battle Again!
              </button>
              <Link
                href="/party"
                className="px-6 py-2.5 bg-gray-100 text-gray-600 font-semibold rounded-full hover:bg-gray-200 transition-colors"
              >
                Party
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
