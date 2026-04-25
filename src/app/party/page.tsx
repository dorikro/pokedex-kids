"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { playerState } from "@/lib/player-state";
import { useTranslation } from "@/lib/i18n/index";
import { formatPokemonName } from "@/lib/api-client";
import TypeBadge from "@/components/TypeBadge";
import type { OwnedPokemon, PlayerState } from "@/lib/types";

// ─── HP bar ──────────────────────────────────────────────────────────────────

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(0, Math.min((current / max) * 100, 100));
  const color =
    pct > 50 ? "bg-green-400" : pct > 20 ? "bg-yellow-400" : "bg-red-400";

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-400 w-6">HP</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-gray-500 font-mono w-14 text-end">
        {current}/{max}
      </span>
    </div>
  );
}

// ─── XP bar ──────────────────────────────────────────────────────────────────

function XpBar({ xp, xpToNextLevel }: { xp: number; xpToNextLevel: number }) {
  const pct = Math.max(0, Math.min((xp / xpToNextLevel) * 100, 100));
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-400 w-6">XP</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-gray-400 font-mono w-14 text-end">
        {xp}/{xpToNextLevel}
      </span>
    </div>
  );
}

// ─── Pokemon card (compact) ───────────────────────────────────────────────────

function PokemonCard({
  pokemon,
  inParty,
  onMoveToBox,
  onMoveToParty,
  onRelease,
  partyFull,
}: {
  pokemon: OwnedPokemon;
  inParty: boolean;
  onMoveToBox: () => void;
  onMoveToParty: () => void;
  onRelease: () => void;
  partyFull: boolean;
}) {
  const { t } = useTranslation();
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        {pokemon.species.sprite ? (
          <img
            src={pokemon.species.sprite}
            alt={formatPokemonName(pokemon.species.name)}
            width={64}
            height={64}
            className="w-16 h-16 image-rendering-pixelated flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-xl flex-shrink-0">
            ?
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-800">
              {formatPokemonName(pokemon.nickname)}
            </p>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {t.game.level} {pokemon.level}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 font-mono">
            #{pokemon.species.id.toString().padStart(4, "0")}
          </p>
          <div className="flex gap-1 mt-1 flex-wrap">
            {pokemon.species.types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowActions((v) => !v)}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1"
          aria-label="Options"
          type="button"
        >
          ⋯
        </button>
      </div>

      {/* HP + XP bars */}
      <div className="space-y-1">
        <HpBar current={pokemon.currentHp} max={pokemon.maxHp} />
        <XpBar xp={pokemon.xp} xpToNextLevel={pokemon.xpToNextLevel} />
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="flex gap-2 pt-1 flex-wrap">
          {inParty ? (
            <button
              onClick={() => { onMoveToBox(); setShowActions(false); }}
              className="flex-1 text-xs py-1.5 px-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              type="button"
            >
              {t.game.moveToBox}
            </button>
          ) : (
            <button
              onClick={() => { onMoveToParty(); setShowActions(false); }}
              disabled={partyFull}
              className="flex-1 text-xs py-1.5 px-3 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              type="button"
            >
              {t.game.moveToParty}
            </button>
          )}
          <button
            onClick={onRelease}
            className="text-xs py-1.5 px-3 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            type="button"
          >
            {t.game.release}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main party page ──────────────────────────────────────────────────────────

export default function PartyPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [state, setState] = useState<PlayerState | null>(null);
  const [tab, setTab] = useState<"party" | "box">("party");

  const load = useCallback(() => setState(playerState.get()), []);

  useEffect(() => {
    const s = playerState.get();
    if (!s.hasStarted) {
      router.replace("/start");
      return;
    }
    setState(s);
  }, [router]);

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  const handleMoveToBox = (instanceId: string) => {
    setState(playerState.moveToBox(state, instanceId));
  };

  const handleMoveToParty = (instanceId: string) => {
    setState(playerState.moveToParty(state, instanceId));
  };

  const handleRelease = (instanceId: string, name: string) => {
    if (confirm(t.game.releaseConfirm(formatPokemonName(name)))) {
      setState(playerState.release(state, instanceId));
      load();
    }
  };

  const partyFull = state.party.length >= playerState.MAX_PARTY_SIZE;
  const displayList = tab === "party" ? state.party : state.box;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.game.partyTitle}</h1>
        <p className="text-gray-500 text-sm mt-0.5">{t.game.partySubtitle}</p>
      </div>

      {/* Trainer info strip */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 flex items-center gap-4 flex-wrap">
        <div className="text-3xl">🧢</div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800">{state.trainerName}</p>
          <p className="text-xs text-gray-400">
            {t.game.seen}: {state.seen.length} &nbsp;·&nbsp;
            {t.game.caught}: {state.caught.length} &nbsp;·&nbsp;
            🎾 {state.pokeballs}
          </p>
        </div>
        <Link
          href="/wild"
          className="px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-full hover:bg-green-600 transition-colors"
        >
          Wild Area
        </Link>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        {(["party", "box"] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === tabKey
                ? "bg-red-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            type="button"
          >
            {tabKey === "party"
              ? `${t.game.partyTitle} (${state.party.length}/${playerState.MAX_PARTY_SIZE})`
              : `${t.game.boxTitle} (${state.box.length})`}
          </button>
        ))}
      </div>

      {/* Pokemon list */}
      {displayList.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📦</div>
          <p>{tab === "party" ? t.game.partyEmpty : t.game.boxEmpty}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {displayList.map((pokemon) => (
            <PokemonCard
              key={pokemon.instanceId}
              pokemon={pokemon}
              inParty={tab === "party"}
              partyFull={partyFull}
              onMoveToBox={() => handleMoveToBox(pokemon.instanceId)}
              onMoveToParty={() => handleMoveToParty(pokemon.instanceId)}
              onRelease={() => handleRelease(pokemon.instanceId, pokemon.nickname)}
            />
          ))}
        </div>
      )}

      {/* New game footer */}
      <div className="mt-12 text-center">
        <button
          onClick={() => {
            if (confirm(t.game.newGameConfirm)) {
              playerState.reset();
              router.push("/start");
            }
          }}
          className="text-xs text-gray-300 hover:text-red-400 transition-colors"
          type="button"
        >
          {t.game.newGame}
        </button>
      </div>
    </div>
  );
}
