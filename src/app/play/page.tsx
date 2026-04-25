"use client";

/**
 * /play — Unified game hub.
 *
 * All game features in one page: Party management, Wild encounters (fight+catch),
 * Trainer battles, Shop, and Pokémon Clinic.  No page navigation during gameplay.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { playerState, applyRealMoves, xpReward, awardXp, createOwnedPokemon } from "@/lib/player-state";
import { getArea } from "@/lib/areas";
import { resolveTurn, attemptFlee, buildWildBattlePokemon } from "@/lib/battle";
import { attemptCatch, pickWildPokemonId, pickWildLevel } from "@/lib/catch";
import { fetchPokemonDetail, formatPokemonName } from "@/lib/api-client";
import { ITEM_CATALOGUE, ITEM_MAP, applyItemToPokemon } from "@/lib/items";
import { TRAINERS } from "@/lib/trainer";
import { useTranslation } from "@/lib/i18n/index";
import TypeBadge from "@/components/TypeBadge";
import Link from "next/link";
import type { OwnedPokemon, PlayerState, LocalPokemon, ItemId } from "@/lib/types";
import type { BattleEvent } from "@/lib/battle";

// ─── Constants ────────────────────────────────────────────────────────────────

const CLINIC_COST = 200; // ₽200 flat fee to heal all party Pokémon
const POKE_SPRITE = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const ITEM_SPRITES = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "party" | "wild" | "trainers" | "shop" | "clinic";

interface BattleCtx {
  mode: "wild" | "trainer";
  phase: "choose_action" | "animating" | "battle_over";
  playerPokemon: OwnedPokemon;
  enemyPokemon: OwnedPokemon;
  eventLog: BattleEvent[];
  winner: "player" | "enemy" | null;
  moneyEarned: number;
  trainerName: string | null;
  trainerAvatarId: number | null;
  isCatchable: boolean;
  playerShaking: boolean;
  enemyShaking: boolean;
  trainerId: string | null;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(0, Math.min((current / max) * 100, 100));
  const color = pct > 50 ? "bg-green-400" : pct > 20 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
        <span>HP</span>
        <span className="font-mono">{current}/{max}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function HpBarLarge({ current, max, animate }: { current: number; max: number; animate?: boolean }) {
  const pct = Math.max(0, Math.min((current / max) * 100, 100));
  const color = pct > 50 ? "bg-green-400" : pct > 20 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>HP</span>
        <span className="font-mono">{current}/{max}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} ${animate ? "transition-all duration-700" : ""}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const TYPE_BTN: Record<string, string> = {
  normal: "bg-stone-100 border-stone-300 text-stone-700",
  fire: "bg-red-50 border-red-300 text-red-700",
  water: "bg-blue-50 border-blue-300 text-blue-700",
  electric: "bg-yellow-50 border-yellow-300 text-yellow-700",
  grass: "bg-green-50 border-green-300 text-green-700",
  ice: "bg-cyan-50 border-cyan-300 text-cyan-700",
  fighting: "bg-orange-50 border-orange-300 text-orange-700",
  poison: "bg-purple-50 border-purple-300 text-purple-700",
  ground: "bg-amber-50 border-amber-300 text-amber-700",
  flying: "bg-indigo-50 border-indigo-300 text-indigo-700",
  psychic: "bg-pink-50 border-pink-300 text-pink-700",
  bug: "bg-lime-50 border-lime-300 text-lime-700",
  rock: "bg-yellow-100 border-yellow-400 text-yellow-800",
  ghost: "bg-violet-50 border-violet-300 text-violet-700",
  dragon: "bg-indigo-100 border-indigo-400 text-indigo-800",
  dark: "bg-gray-200 border-gray-400 text-gray-700",
  steel: "bg-slate-100 border-slate-300 text-slate-700",
  fairy: "bg-pink-50 border-pink-300 text-pink-700",
};

function EventLog({ events }: { events: BattleEvent[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth" }); }, [events]);
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 h-24 overflow-y-auto text-sm space-y-1">
      {events.map((e, i) => (
        <p key={i} className={
          e.kind === "ko" ? "font-bold text-red-600"
          : e.kind === "level_up" ? "font-bold text-blue-600"
          : e.kind === "critical" ? "font-semibold text-yellow-600"
          : e.kind === "effectiveness" && e.text.includes("super") ? "font-semibold text-green-600"
          : "text-gray-700"
        }>{e.text}</p>
      ))}
      <div ref={ref} />
    </div>
  );
}

// ─── Main Play Page ───────────────────────────────────────────────────────────

export default function PlayPage() {
  const { t } = useTranslation();
  const [save, setSave] = useState<PlayerState | null>(null);
  const [tab, setTab] = useState<Tab>("party");
  const [flash, setFlash] = useState<{ msg: string; ok: boolean } | null>(null);

  // ── Wild state ──────────────────────────────────────────────────
  const [wildPhase, setWildPhase] = useState<"walk" | "loading" | "encounter">("walk");
  const [wildSpecies, setWildSpecies] = useState<LocalPokemon | null>(null);
  const [wildLevel, setWildLevel] = useState(5);
  const [ballAnim, setBallAnim] = useState(false);

  // ── Battle state (shared for wild + trainer) ────────────────────
  const [battle, setBattle] = useState<BattleCtx | null>(null);

  // ── Item selection for use in party ────────────────────────────
  const [itemTarget, setItemTarget] = useState<string | null>(null); // instanceId

  useEffect(() => { setSave(playerState.get()); }, []);

  function updateSave(next: PlayerState) { setSave(next); }

  function showFlash(msg: string, ok = true) {
    setFlash({ msg, ok });
    setTimeout(() => setFlash(null), 3000);
  }

  // ─── Wild: start encounter ─────────────────────────────────────

  async function startWildEncounter() {
    if (!save) return;
    const lead = save.party.find(p => p.currentHp > 0);
    if (!lead) { showFlash("All your Pokémon have fainted! Visit the Clinic first.", false); return; }

    setWildPhase("loading");
    try {
      const area = getArea(save.currentAreaId);
      const wId = pickWildPokemonId(area);
      const wLevel = pickWildLevel(area);
      const species = await fetchPokemonDetail(String(wId));
      setWildSpecies(species as unknown as LocalPokemon);
      setWildLevel(wLevel);
      setWildPhase("encounter");
    } catch {
      setWildPhase("walk");
      showFlash("Something went wrong. Try again.", false);
    }
  }

  function throwBall(itemId: ItemId = "pokeball") {
    if (!save || !wildSpecies) return;
    const ballCount = save.inventory.find(i => i.itemId === itemId)?.quantity ?? 0;
    if (ballCount <= 0) { showFlash("No balls left! Buy more at the Shop.", false); return; }

    const { ok: spent, state: afterSpend } = playerState.useItem(save, itemId);
    if (!spent) { showFlash("No balls left!", false); return; }
    updateSave(afterSpend);

    const item = ITEM_MAP[itemId];
    const modifier = item?.catchModifier ?? 1;
    const area = getArea(afterSpend.currentAreaId);

    setBallAnim(true);
    setTimeout(() => setBallAnim(false), 800);

    const catchResult = attemptCatch(wildSpecies.id, wildSpecies.stats?.find(s => s.name === "hp")?.base_stat ?? 45,
      wildSpecies.stats?.find(s => s.name === "hp")?.base_stat ?? 45, area, modifier);

    setTimeout(() => {
      if (catchResult.success) {
        const newPokemon = createOwnedPokemon(wildSpecies as unknown as LocalPokemon, wildLevel, afterSpend.currentAreaId);
        const next = playerState.addPokemon(afterSpend, newPokemon);
        updateSave(next);
        showFlash(`${formatPokemonName(wildSpecies.name)} was caught!`);
        setWildPhase("walk");
        setWildSpecies(null);
      } else {
        showFlash(`${formatPokemonName(wildSpecies.name)} broke free!`, false);
        setWildPhase("walk");
        setWildSpecies(null);
      }
    }, 900);
  }

  function fleeWild() {
    setWildPhase("walk");
    setWildSpecies(null);
  }

  // ─── Battle: start ─────────────────────────────────────────────

  async function startBattle(mode: "wild" | "trainer", trainerId?: string) {
    if (!save) return;
    const lead = save.party.find(p => p.currentHp > 0);
    if (!lead) { showFlash("All your Pokémon have fainted! Visit the Clinic first.", false); return; }

    // Load real moves for lead (preserves existing PP via updated applyRealMoves)
    let playerPokemon = lead;
    try {
      const res = await fetch(`/api/moves/${lead.species.id}`);
      if (res.ok) {
        const { moves } = await res.json();
        if (moves?.length) playerPokemon = applyRealMoves(lead, moves);
      }
    } catch { /* use synthetic */ }

    // Save updated moves (preserving PP) back so HP/PP state is fresh
    updateSave(playerState.updatePokemon(save, playerPokemon));

    let enemyPokemon: OwnedPokemon;
    let trainerName: string | null = null;
    let trainerAvatarId: number | null = null;
    let moneyEarned = 0;
    let isCatchable = false;

    if (mode === "trainer" && trainerId) {
      const trainer = TRAINERS.find(t => t.id === trainerId);
      if (!trainer) return;
      trainerName = trainer.name;
      trainerAvatarId = trainer.leadPokemonId;
      moneyEarned = trainer.reward;
      const { pokemonId, level } = trainer.party[0];
      const species = await fetchPokemonDetail(String(pokemonId));
      enemyPokemon = buildWildBattlePokemon({ id: species.id, name: species.name, types: species.types, sprite: species.sprite, artwork: species.artwork, stats: species.stats }, level);
    } else {
      // Wild battle — also catchable
      isCatchable = true;
      const area = getArea(save.currentAreaId);
      const wId = pickWildPokemonId(area);
      const wLevel = pickWildLevel(area);
      const wSpecies = await fetchPokemonDetail(String(wId));
      enemyPokemon = buildWildBattlePokemon({ id: wSpecies.id, name: wSpecies.name, types: wSpecies.types, sprite: wSpecies.sprite, artwork: wSpecies.artwork, stats: wSpecies.stats }, wLevel);
    }

    setBattle({
      mode, phase: "choose_action",
      playerPokemon, enemyPokemon,
      eventLog: [{ kind: "move_used", text: trainerName ? `${trainerName}: "${TRAINERS.find(t=>t.id===trainerId)?.intro}"` : `A wild ${formatPokemonName(enemyPokemon.nickname)} appeared!` }],
      winner: null, moneyEarned, trainerName, trainerAvatarId,
      isCatchable, playerShaking: false, enemyShaking: false,
      trainerId: trainerId ?? null,
    });
  }

  // ─── Battle: move selected ─────────────────────────────────────

  const handleMove = useCallback((moveIndex: number) => {
    if (!battle || battle.phase !== "choose_action" || !save) return;
    setBattle(b => b ? { ...b, phase: "animating" } : null);

    const result = resolveTurn(battle.playerPokemon, battle.enemyPokemon, moveIndex);

    const playerHurt = result.playerPokemon.currentHp < battle.playerPokemon.currentHp;
    const enemyHurt = result.enemyPokemon.currentHp < battle.enemyPokemon.currentHp;

    setBattle(b => b ? {
      ...b,
      playerPokemon: result.playerPokemon,
      enemyPokemon: result.enemyPokemon,
      eventLog: [...b.eventLog, ...result.events],
      playerShaking: playerHurt,
      enemyShaking: enemyHurt,
    } : null);
    if (playerHurt) setTimeout(() => setBattle(b => b ? { ...b, playerShaking: false } : null), 600);
    if (enemyHurt) setTimeout(() => setBattle(b => b ? { ...b, enemyShaking: false } : null), 600);

    // Persist HP + PP after each turn
    const mid = playerState.updatePokemon(save, result.playerPokemon);
    updateSave(mid);

    if (result.battleOver) {
      handleBattleEnd(result.playerPokemon, result.enemyPokemon, result.winner, mid);
    } else {
      setTimeout(() => setBattle(b => b ? { ...b, phase: "choose_action" } : null), 800);
    }
  }, [battle, save]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Battle: throw ball in wild battle ────────────────────────

  const handleBattleCatch = useCallback(() => {
    if (!battle || !save || !battle.isCatchable) return;
    const ballCount = save.inventory.find(i => i.itemId === "pokeball")?.quantity ?? 0;
    if (ballCount <= 0) { showFlash("No Pokéballs left! Buy more at the Shop.", false); return; }

    const { ok: spent, state: afterSpend } = playerState.useItem(save, "pokeball");
    if (!spent) return;
    updateSave(afterSpend);

    const area = getArea(afterSpend.currentAreaId);
    const { enemyPokemon } = battle;
    const catchResult = attemptCatch(
      enemyPokemon.pokemonId,
      enemyPokemon.currentHp,
      enemyPokemon.maxHp,
      area,
      1
    );

    const catchMsg = catchResult.success
      ? `Gotcha! ${formatPokemonName(enemyPokemon.nickname)} was caught!`
      : `${formatPokemonName(enemyPokemon.nickname)} broke free!`;

    setBattle(b => b ? { ...b, eventLog: [...b.eventLog, { kind: "move_used", text: catchMsg }] } : null);

    if (catchResult.success) {
      import("@/lib/player-state").then(({ createOwnedPokemon }) => {
        // Build a proper OwnedPokemon from the battle enemy
        const newPok = createOwnedPokemon(
          {
            id: enemyPokemon.species.id,
            name: enemyPokemon.species.name,
            types: enemyPokemon.species.types,
            sprite: enemyPokemon.species.sprite,
            artwork: enemyPokemon.species.artwork ?? null,
            stats: enemyPokemon.species.baseStats,
            evolution_chain: enemyPokemon.species.evolutionChain,
          } as import("@/lib/types").LocalPokemon,
          enemyPokemon.level,
          afterSpend.currentAreaId
        );
        const withCatch = playerState.addPokemon(afterSpend, newPok);
        updateSave(withCatch);
        setTimeout(() => {
          setBattle(null);
          showFlash(`${formatPokemonName(enemyPokemon.nickname)} was caught and added to your party!`);
        }, 1000);
      });
    }
    // On fail: enemy retaliates
    else {
      setBattle(b => b ? { ...b, phase: "animating" } : null);
      setTimeout(() => {
        setBattle(b => {
          if (!b) return null;
          const enemyMove = b.enemyPokemon.moves[Math.floor(Math.random() * b.enemyPokemon.moves.length)];
          const enemyResult = resolveTurn(b.enemyPokemon, b.playerPokemon, b.enemyPokemon.moves.indexOf(enemyMove));
          const mid2 = playerState.updatePokemon(afterSpend, enemyResult.enemyPokemon);
          updateSave(mid2);
          if (enemyResult.battleOver) {
            handleBattleEnd(enemyResult.enemyPokemon, enemyResult.playerPokemon, enemyResult.winner === "player" ? "enemy" : "player", mid2);
            return { ...b, playerPokemon: enemyResult.enemyPokemon, phase: "battle_over" };
          }
          return { ...b, playerPokemon: enemyResult.enemyPokemon, eventLog: [...b.eventLog, ...enemyResult.events], phase: "choose_action" };
        });
      }, 800);
    }
  }, [battle, save]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Battle: flee ─────────────────────────────────────────────

  const handleBattleFlee = useCallback(() => {
    if (!battle || battle.phase !== "choose_action" || !save) return;
    // Can't flee trainer battles
    if (battle.mode === "trainer") return;
    setBattle(b => b ? { ...b, phase: "animating" } : null);

    const result = attemptFlee(battle.playerPokemon, battle.enemyPokemon);
    const mid = playerState.updatePokemon(save, result.playerPokemon);
    updateSave(mid);

    setBattle(b => b ? { ...b, playerPokemon: result.playerPokemon, eventLog: [...b.eventLog, ...result.events] } : null);

    if (result.fled) {
      setTimeout(() => { setBattle(null); showFlash("Got away safely!"); }, 800);
    } else {
      setTimeout(() => setBattle(b => b ? { ...b, phase: "choose_action" } : null), 800);
    }
  }, [battle, save]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Battle: end ──────────────────────────────────────────────

  const handleBattleEnd = useCallback((
    finalPlayer: OwnedPokemon,
    finalEnemy: OwnedPokemon,
    winner: "player" | "enemy" | null,
    currentSave: PlayerState
  ) => {
    const newEvents: BattleEvent[] = [];
    const stateWithHp = playerState.updatePokemon(currentSave, finalPlayer);

    if (winner === "player") {
      const xp = xpReward(finalEnemy.level, false);
      const { state: withXp, result: lvlResult } = playerState.awardBattleXp(stateWithHp, 0, xp);
      let finalSave = withXp;

      setBattle(b => {
        if (!b) return null;
        if (b.trainerId && b.moneyEarned > 0) {
          finalSave = playerState.earnMoney(finalSave, b.moneyEarned);
          newEvents.push({ kind: "move_used", text: `You beat ${b.trainerName} and earned ₽${b.moneyEarned}!` });
        }
        updateSave(finalSave);
        newEvents.push({ kind: "xp_gained", text: `${formatPokemonName(finalPlayer.nickname)} gained ${xp} XP!`, xp });
        if (lvlResult.levelsGained > 0) {
          newEvents.push({ kind: "level_up", text: `${formatPokemonName(finalPlayer.nickname)} grew to Lv. ${lvlResult.pokemon.level}!`, newLevel: lvlResult.pokemon.level });
        }
        if (lvlResult.evolved && lvlResult.evolutionTargetId) {
          newEvents.push({ kind: "evolution", text: `${formatPokemonName(finalPlayer.nickname)} is evolving into #${lvlResult.evolutionTargetId}!`, evolutionTargetId: lvlResult.evolutionTargetId });
        }
        const updatedPlayer = lvlResult.levelsGained > 0 ? lvlResult.pokemon : finalPlayer;
        return { ...b, playerPokemon: updatedPlayer, winner: "player", eventLog: [...b.eventLog, ...newEvents] };
      });
    } else {
      updateSave(stateWithHp);
      setBattle(b => b ? { ...b, winner: "enemy", eventLog: [...b.eventLog, { kind: "ko", text: `${formatPokemonName(finalPlayer.nickname)} fainted!` }] } : null);
    }

    setTimeout(() => setBattle(b => b ? { ...b, phase: "battle_over" } : null), 1200);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Item use (party tab) ─────────────────────────────────────

  function useItemOnPokemon(pokemonId: string, itemId: ItemId) {
    if (!save) return;
    const pokemon = save.party.find(p => p.instanceId === pokemonId);
    if (!pokemon) return;
    const result = applyItemToPokemon(itemId, pokemon);
    if (!result.ok) { showFlash(result.message, false); return; }
    const { ok: used, state: afterUse } = playerState.useItem(save, itemId);
    if (!used) { showFlash("No more of that item!", false); return; }
    const final = playerState.updatePokemon(afterUse, result.updatedPokemon!);
    updateSave(final);
    showFlash(result.message);
    setItemTarget(null);
  }

  // ─── Render guard ─────────────────────────────────────────────

  if (!save) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!save.hasStarted) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🎮</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">No save file found</h1>
        <p className="text-gray-500 mb-6">Start a new game to play!</p>
        <Link href="/start" className="px-8 py-3 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition-colors">
          Start Game
        </Link>
      </div>
    );
  }

  const ballCount = save.inventory.find(i => i.itemId === "pokeball")?.quantity ?? 0;
  const greatBallCount = save.inventory.find(i => i.itemId === "great-ball")?.quantity ?? 0;
  const totalBalls = ballCount + greatBallCount;
  const lead = save.party[0];

  // ─── Tab: Party ───────────────────────────────────────────────

  function renderParty() {
    const usableItems = save!.inventory.filter(i => {
      const def = ITEM_MAP[i.itemId];
      return def && (def.effect === "heal" || def.effect === "revive") && i.quantity > 0;
    });

    return (
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Party ({save!.party.length}/{playerState.MAX_PARTY_SIZE})</h2>
        {save!.party.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">No Pokémon in your party yet.</p>
        )}
        {save!.party.map(pokemon => (
          <div key={pokemon.instanceId} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <img src={pokemon.species.sprite ?? POKE_SPRITE(pokemon.pokemonId)} alt={formatPokemonName(pokemon.nickname)} width={56} height={56} className="w-14 h-14 object-contain image-rendering-pixelated flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-800">{formatPokemonName(pokemon.nickname)}</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Lv.{pokemon.level}</span>
                  {pokemon.currentHp <= 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Fainted</span>}
                </div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {pokemon.species.types.map(type => <TypeBadge key={type} type={type} />)}
                </div>
                <div className="mt-2"><HpBar current={pokemon.currentHp} max={pokemon.maxHp} /></div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>XP: {pokemon.xp} / {pokemon.xpToNextLevel}</span>
                  <span>{pokemon.moves.map(m => `${m.name} (${m.currentPp}/${m.pp})`).join(" · ")}</span>
                </div>
              </div>
            </div>
            {/* Item use */}
            {usableItems.length > 0 && pokemon.currentHp < pokemon.maxHp && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                {itemTarget === pokemon.instanceId ? (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500 w-full">Use item:</span>
                    {usableItems.map(slot => {
                      const def = ITEM_MAP[slot.itemId];
                      if (!def) return null;
                      const canUse = def.effect === "revive" ? pokemon.currentHp <= 0 : pokemon.currentHp > 0 && pokemon.currentHp < pokemon.maxHp;
                      return canUse ? (
                        <button key={slot.itemId} onClick={() => useItemOnPokemon(pokemon.instanceId, slot.itemId)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-full hover:bg-green-100 transition-colors">
                          <img src={`${ITEM_SPRITES}/${slot.itemId === "pokeball" ? "poke-ball" : slot.itemId === "great-ball" ? "great-ball" : slot.itemId === "super-potion" ? "super-potion" : slot.itemId}.png`} alt="" width={16} height={16} className="w-4 h-4 object-contain" />
                          {def.name} ×{slot.quantity}
                        </button>
                      ) : null;
                    })}
                    <button onClick={() => setItemTarget(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setItemTarget(pokemon.instanceId)} className="text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                    Use Item
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {save!.box.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-4">PC Box ({save!.box.length})</h2>
            <div className="grid grid-cols-2 gap-2">
              {save!.box.map(pokemon => (
                <div key={pokemon.instanceId} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-2">
                  <img src={pokemon.species.sprite ?? POKE_SPRITE(pokemon.pokemonId)} alt={formatPokemonName(pokemon.nickname)} width={40} height={40} className="w-10 h-10 object-contain image-rendering-pixelated" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">{formatPokemonName(pokemon.nickname)}</div>
                    <div className="text-xs text-gray-400">Lv.{pokemon.level}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // ─── Tab: Wild ────────────────────────────────────────────────

  function renderWild() {
    if (wildPhase === "loading") {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-green-200 border-t-green-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Rustling in the grass…</p>
        </div>
      );
    }

    if (wildPhase === "encounter" && wildSpecies) {
      return (
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="text-center">
            <p className="text-sm text-gray-500 font-medium">A wild Pokémon appeared!</p>
            <div className={`my-4 ${ballAnim ? "animate-bounce" : ""}`}>
              {wildSpecies.artwork ? (
                <img src={wildSpecies.artwork} alt={formatPokemonName(wildSpecies.name)} width={140} height={140} className="w-36 h-36 object-contain drop-shadow-xl mx-auto" />
              ) : (
                <img src={wildSpecies.sprite ?? ""} alt={formatPokemonName(wildSpecies.name)} width={96} height={96} className="w-24 h-24 object-contain image-rendering-pixelated mx-auto" />
              )}
            </div>
            <p className="text-2xl font-bold text-gray-800">{formatPokemonName(wildSpecies.name)}</p>
            <p className="text-sm text-gray-500">Lv. {wildLevel}</p>
            <div className="flex gap-1.5 justify-center mt-2">
              {wildSpecies.types?.map(type => <TypeBadge key={type} type={type} />)}
            </div>
          </div>

          <div className="w-full space-y-2">
            <button
              onClick={() => { setWildPhase("walk"); setWildSpecies(null); startBattle("wild"); }}
              className="w-full py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors"
            >
              ⚔️ Fight!
            </button>

            <div className="flex gap-2">
              {ballCount > 0 && (
                <button onClick={() => throwBall("pokeball")}
                  className="flex-1 py-3 bg-white border-2 border-red-300 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                  <img src={`${ITEM_SPRITES}/poke-ball.png`} alt="" width={20} height={20} className="w-5 h-5 object-contain" />
                  Throw Ball ({ballCount})
                </button>
              )}
              {greatBallCount > 0 && (
                <button onClick={() => throwBall("great-ball")}
                  className="flex-1 py-3 bg-white border-2 border-blue-300 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                  <img src={`${ITEM_SPRITES}/great-ball.png`} alt="" width={20} height={20} className="w-5 h-5 object-contain" />
                  Great Ball ({greatBallCount})
                </button>
              )}
            </div>

            {totalBalls === 0 && (
              <p className="text-center text-xs text-gray-400">No balls! Buy some at the Shop.</p>
            )}

            <button onClick={fleeWild} className="w-full py-2 bg-gray-100 text-gray-500 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm">
              Run Away
            </button>
          </div>
        </div>
      );
    }

    // Walk phase
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="text-8xl">🌿</div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">Tall Grass</h2>
          <p className="text-gray-500 text-sm mt-1">Wild Pokémon are lurking…</p>
        </div>
        <button
          onClick={startWildEncounter}
          className="px-10 py-4 bg-green-500 text-white font-bold text-lg rounded-2xl hover:bg-green-600 active:scale-95 transition-all shadow-md"
        >
          🚶 Walk into the Grass
        </button>
        <div className="text-sm text-gray-400">
          Balls: 🎾 {ballCount}{greatBallCount > 0 ? ` · 🔵 ${greatBallCount}` : ""}
        </div>
      </div>
    );
  }

  // ─── Tab: Trainers ────────────────────────────────────────────

  function renderTrainers() {
    const badges = save!.badges ?? 0;
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Trainer Battles</h2>
        <p className="text-xs text-gray-400 -mt-1">Beat trainers to earn PokéDollars.</p>
        {TRAINERS.map(trainer => {
          const locked = badges < trainer.requiredBadges;
          return (
            <div key={trainer.id} className={`flex items-center gap-3 border rounded-2xl p-4 shadow-sm transition-opacity ${locked ? "opacity-50 bg-gray-50 border-gray-200" : "bg-white border-gray-200"}`}>
              <div className="w-14 h-14 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                <img src={POKE_SPRITE(trainer.leadPokemonId)} alt={trainer.name} width={56} height={56} className="w-14 h-14 object-contain image-rendering-pixelated" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800">{trainer.emoji} {trainer.name}</div>
                <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{trainer.intro}</div>
                <div className={`text-xs font-semibold mt-1 ${locked ? "text-gray-400" : "text-yellow-600"}`}>
                  {locked ? `🔒 Need ${trainer.requiredBadges} badge${trainer.requiredBadges !== 1 ? "s" : ""}` : `₽${trainer.reward} reward`}
                </div>
              </div>
              {!locked && (
                <button
                  onClick={() => startBattle("trainer", trainer.id)}
                  className="px-4 py-2 bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors flex-shrink-0"
                >
                  Battle!
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ─── Tab: Shop ────────────────────────────────────────────────

  function renderShop() {
    function buyItem(itemId: string) {
      const item = ITEM_CATALOGUE.find(i => i.id === itemId);
      if (!item || !save) return;
      const { ok, state: next } = playerState.spendMoney(save!, item.price);
      if (!ok) { showFlash("Not enough PokéDollars!", false); return; }
      const final = playerState.addItem(next, item.id as ItemId, 1);
      updateSave(final);
      showFlash(`Bought ${item.name}!`);
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Poké Mart</h2>
          <span className="text-lg font-bold text-yellow-600">₽{save!.money.toLocaleString()}</span>
        </div>
        {ITEM_CATALOGUE.map(item => {
          const owned = save!.inventory.find(i => i.itemId === item.id)?.quantity ?? 0;
          return (
            <div key={item.id} className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-gray-50 rounded-xl">
                <img src={item.sprite} alt={item.name} width={40} height={40} className="w-10 h-10 object-contain image-rendering-pixelated" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800">{item.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                <div className="text-xs text-gray-400 mt-0.5">You have: {owned}</div>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className="text-sm font-bold text-yellow-600">₽{item.price}</span>
                <button
                  onClick={() => buyItem(item.id)}
                  disabled={save!.money < item.price}
                  className="px-4 py-1.5 bg-red-500 text-white text-sm font-semibold rounded-full hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Buy
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ─── Tab: Clinic ──────────────────────────────────────────────

  function renderClinic() {
    const needsHealing = save!.party.some(p => p.currentHp < p.maxHp || p.moves.some(m => m.currentPp < m.pp));
    const canAfford = save!.money >= CLINIC_COST;

    function heal() {
      const { ok, state: next } = playerState.healAll(save!, CLINIC_COST);
      if (!ok) { showFlash("Not enough PokéDollars!", false); return; }
      updateSave(next);
      showFlash("All Pokémon are fully healed!");
    }

    return (
      <div className="space-y-4">
        <div className="text-center py-4">
          <div className="text-6xl mb-3">🏥</div>
          <h2 className="text-xl font-bold text-gray-800">Pokémon Clinic</h2>
          <p className="text-gray-500 text-sm mt-1">Heal all your Pokémon to full HP and restore all PP.</p>
          <p className="text-yellow-600 font-bold mt-1">Cost: ₽{CLINIC_COST}</p>
        </div>

        {/* Party HP preview */}
        <div className="space-y-2">
          {save!.party.map(p => (
            <div key={p.instanceId} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3">
              <img src={p.species.sprite ?? POKE_SPRITE(p.pokemonId)} alt={formatPokemonName(p.nickname)} width={40} height={40} className="w-10 h-10 object-contain image-rendering-pixelated flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800">{formatPokemonName(p.nickname)}</span>
                  <span className="text-xs text-gray-400">Lv.{p.level}</span>
                </div>
                <HpBar current={p.currentHp} max={p.maxHp} />
              </div>
              <div className={`text-xs font-bold px-2 py-1 rounded-full ${p.currentHp <= 0 ? "bg-red-100 text-red-600" : p.currentHp < p.maxHp ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                {p.currentHp <= 0 ? "Fainted" : p.currentHp < p.maxHp ? "Hurt" : "Healthy"}
              </div>
            </div>
          ))}
        </div>

        {needsHealing ? (
          <button
            onClick={heal}
            disabled={!canAfford}
            className="w-full py-4 bg-pink-500 text-white font-bold text-lg rounded-2xl hover:bg-pink-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            {canAfford ? `✨ Heal All Pokémon (₽${CLINIC_COST})` : `Not enough money (need ₽${CLINIC_COST})`}
          </button>
        ) : (
          <div className="text-center py-4 bg-green-50 border border-green-200 rounded-2xl">
            <p className="text-green-700 font-semibold">✅ All Pokémon are at full health!</p>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center">
          Tip: Visit after tough battles to stay ready for the next challenge.
        </p>
      </div>
    );
  }

  // ─── Battle screen ────────────────────────────────────────────

  function renderBattle() {
    if (!battle) return null;
    const { playerPokemon: pp, enemyPokemon: ep, phase, isCatchable, eventLog, winner, trainerName, trainerAvatarId, moneyEarned, playerShaking, enemyShaking } = battle;
    const isAnimating = phase === "animating";
    const isOver = phase === "battle_over";

    return (
      <div className="space-y-4 pb-4">
        {/* Trainer avatar banner */}
        {trainerAvatarId && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-3">
            <img src={POKE_SPRITE(trainerAvatarId)} alt={trainerName ?? "Trainer"} width={48} height={48} className="w-12 h-12 object-contain image-rendering-pixelated flex-shrink-0" />
            <div>
              <div className="font-semibold text-blue-800 text-sm">{trainerName}</div>
              <div className="text-xs text-blue-600">Reward: ₽{moneyEarned}</div>
            </div>
          </div>
        )}

        {/* Arena */}
        <div className="bg-gradient-to-b from-sky-50 to-green-50 rounded-3xl border border-gray-200 p-5">
          {/* Enemy */}
          <div className={`flex flex-col items-end gap-2 ${enemyShaking ? "animate-bounce" : ""}`}>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Lv.{ep.level}</span>
              <span className="font-bold text-gray-800">{formatPokemonName(ep.nickname)}</span>
            </div>
            <div className="flex gap-1 flex-row-reverse">
              {ep.species.types.map(type => <TypeBadge key={type} type={type} />)}
            </div>
            <img src={ep.species.sprite ?? ""} alt={formatPokemonName(ep.nickname)} width={80} height={80} className="w-20 h-20 object-contain image-rendering-pixelated drop-shadow-md" />
            <div className="w-40"><HpBarLarge current={ep.currentHp} max={ep.maxHp} animate /></div>
          </div>

          <div className="text-center my-2 text-2xl font-bold text-gray-200">— vs —</div>

          {/* Player */}
          <div className={`flex flex-col items-start gap-2 ${playerShaking ? "animate-bounce" : ""}`}>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800">{formatPokemonName(pp.nickname)}</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Lv.{pp.level}</span>
            </div>
            <div className="flex gap-1">
              {pp.species.types.map(type => <TypeBadge key={type} type={type} />)}
            </div>
            <img src={pp.species.artwork ?? pp.species.sprite ?? ""} alt={formatPokemonName(pp.nickname)} width={100} height={100} className="w-24 h-24 object-contain drop-shadow-md" />
            <div className="w-44"><HpBarLarge current={pp.currentHp} max={pp.maxHp} animate /></div>
          </div>
        </div>

        {/* Event log */}
        <EventLog events={eventLog} />

        {/* Controls */}
        {!isOver && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {isAnimating ? "…" : "Your turn — choose a move"}
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {pp.moves.map((move, i) => {
                const colors = TYPE_BTN[move.type] ?? TYPE_BTN.normal;
                const noPP = move.currentPp <= 0;
                return (
                  <button key={i} onClick={() => handleMove(i)} disabled={isAnimating}
                    className={`flex-1 min-w-[calc(50%-4px)] border rounded-xl p-3 text-left transition-all ${isAnimating ? "opacity-40 cursor-not-allowed bg-gray-50 border-gray-200" : colors}`}>
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-semibold text-sm">{move.name}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${noPP ? "bg-red-50 border-red-200 text-red-500" : "bg-white/60 border-current"}`}>
                        {move.currentPp}/{move.pp} PP
                      </span>
                    </div>
                    <div className="flex gap-2 mt-1 text-[10px] opacity-70">
                      <span className="capitalize">{move.type}</span>
                      {move.power && <span>· {move.power} pwr</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              {isCatchable && (
                <button onClick={handleBattleCatch} disabled={isAnimating || totalBalls === 0}
                  className="flex-1 py-2 bg-white border-2 border-red-300 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-40 text-sm flex items-center justify-center gap-1">
                  <img src={`${ITEM_SPRITES}/poke-ball.png`} alt="" width={18} height={18} className="w-4 h-4 object-contain" />
                  Ball ({totalBalls})
                </button>
              )}
              {!trainerName && (
                <button onClick={handleBattleFlee} disabled={isAnimating}
                  className="flex-1 py-2 bg-gray-100 text-gray-500 font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-40 text-sm">
                  Run
                </button>
              )}
            </div>
          </div>
        )}

        {/* Battle over */}
        {isOver && (
          <div className="text-center py-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <p className={`text-xl font-bold mb-1 ${winner === "player" ? "text-green-600" : "text-red-500"}`}>
              {winner === "player" ? "You won! 🎉" : "You lost… 😔"}
            </p>
            {winner === "player" && moneyEarned > 0 && (
              <p className="text-sm text-yellow-600 font-semibold mb-3">+₽{moneyEarned}</p>
            )}
            {winner === "enemy" && (
              <p className="text-xs text-gray-500 mb-3">Visit the Clinic to heal your Pokémon.</p>
            )}
            <div className="flex gap-3 justify-center">
              <button onClick={() => setBattle(null)} className="px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-full hover:bg-gray-200 transition-colors">
                Back
              </button>
              {battle.mode === "wild" && (
                <button onClick={() => { setBattle(null); startBattle("wild"); }} className="px-6 py-2.5 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition-colors">
                  Battle Again
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Tab bar ──────────────────────────────────────────────────

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "party", label: "Party", icon: "🐾" },
    { id: "wild", label: "Wild", icon: "🌿" },
    { id: "trainers", label: "Battle", icon: "⚔️" },
    { id: "shop", label: "Shop", icon: "🏪" },
    { id: "clinic", label: "Clinic", icon: "🏥" },
  ];

  return (
    <div className="flex flex-col max-w-lg mx-auto min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="font-bold text-gray-800">{save.trainerName}</div>
          <div className="text-xs text-gray-400">{lead ? `Lead: ${formatPokemonName(lead.nickname)} Lv.${lead.level}` : "No Pokémon"}</div>
        </div>
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span className="text-yellow-600">₽{save.money.toLocaleString()}</span>
          <span className="text-gray-500">🎾 {ballCount}</span>
        </div>
      </div>

      {/* Flash message */}
      {flash && (
        <div className={`mx-4 mt-3 px-4 py-2.5 rounded-xl text-sm font-medium border ${flash.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {flash.msg}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {battle !== null ? renderBattle() :
         tab === "party" ? renderParty() :
         tab === "wild" ? renderWild() :
         tab === "trainers" ? renderTrainers() :
         tab === "shop" ? renderShop() :
         renderClinic()}
      </div>

      {/* Bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 max-w-lg mx-auto">
        <div className="flex">
          {TABS.map(({ id, label, icon }) => {
            const active = !battle && tab === id;
            return (
              <button key={id}
                onClick={() => { setBattle(null); setTab(id); }}
                className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors text-xs font-medium
                  ${active ? "text-red-500 border-t-2 border-red-500" : "text-gray-400 border-t-2 border-transparent hover:text-gray-600"}`}
              >
                <span className="text-xl">{icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
