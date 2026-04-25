"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { playerState, createOwnedPokemon } from "@/lib/player-state";
import { getArea } from "@/lib/areas";
import { attemptCatch, pickWildPokemonId, pickWildLevel } from "@/lib/catch";
import { fetchPokemonDetail, formatPokemonName } from "@/lib/api-client";
import { useTranslation } from "@/lib/i18n/index";
import TypeBadge from "@/components/TypeBadge";
import type { LocalPokemon, PlayerState } from "@/lib/types";

// ─── Pokeball shake animation CSS (inline keyframe via style tag) ─────────────

const SHAKE_KEYFRAMES = `
@keyframes pokeball-shake {
  0%   { transform: rotate(0deg); }
  20%  { transform: rotate(-15deg); }
  40%  { transform: rotate(15deg); }
  60%  { transform: rotate(-10deg); }
  80%  { transform: rotate(10deg); }
  100% { transform: rotate(0deg); }
}
.pokeball-shake { animation: pokeball-shake 0.4s ease-in-out; }
`;

// ─── Wild Pokemon display ─────────────────────────────────────────────────────

function WildPokemonDisplay({
  pokemon,
  level,
  shaking,
}: {
  pokemon: LocalPokemon;
  level: number;
  shaking: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`relative ${shaking ? "animate-bounce" : ""}`}>
        {pokemon.artwork ? (
          <img
            src={pokemon.artwork}
            alt={formatPokemonName(pokemon.name)}
            width={160}
            height={160}
            className="w-36 h-36 object-contain drop-shadow-xl"
          />
        ) : pokemon.sprite ? (
          <img
            src={pokemon.sprite}
            alt={formatPokemonName(pokemon.name)}
            width={96}
            height={96}
            className="w-24 h-24 image-rendering-pixelated"
          />
        ) : (
          <div className="w-36 h-36 bg-gray-100 rounded-full flex items-center justify-center text-5xl">?</div>
        )}
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-400 font-mono">#{pokemon.id.toString().padStart(4, "0")}</p>
        <p className="text-2xl font-bold text-gray-800">{formatPokemonName(pokemon.name)}</p>
        <p className="text-sm text-gray-500">{t.game.level} {level}</p>
      </div>

      <div className="flex gap-1.5 flex-wrap justify-center">
        {pokemon.types.map((type) => (
          <TypeBadge key={type} type={type} />
        ))}
      </div>
    </div>
  );
}

// ─── Encounter screen ─────────────────────────────────────────────────────────

type EncounterPhase =
  | "idle"        // no encounter yet
  | "appeared"    // wild Pokemon just appeared
  | "throwing"    // Pokeball in the air
  | "shaking"     // Pokeball shaking
  | "caught"      // success
  | "fled"        // Pokemon broke free / player fled
  | "no_balls";   // ran out of Pokeballs

interface EncounterState {
  pokemon: LocalPokemon;
  level: number;
  phase: EncounterPhase;
  message: string;
}

// ─── Main wild page (inner — needs Suspense wrapper for useSearchParams) ───────

function WildPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const [playerSave, setPlayerSave] = useState<PlayerState | null>(null);
  const [encounter, setEncounter] = useState<EncounterState | null>(null);
  const [loadingEncounter, setLoadingEncounter] = useState(false);

  // Redirect if not started
  useEffect(() => {
    const s = playerState.get();
    if (!s.hasStarted) {
      router.replace("/start");
      return;
    }
    setPlayerSave(s);

    // If coming from the overlay with a pre-selected Pokemon, load it
    const encounterId = searchParams.get("encounter");
    const encounterLevel = searchParams.get("level");
    if (encounterId) {
      const level = encounterLevel ? parseInt(encounterLevel, 10) : 5;
      setLoadingEncounter(true);
      fetchPokemonDetail(encounterId).then((pokemon) => {
        const updated = playerState.markSeen(s, pokemon.id);
        playerState.set(updated);
        setPlayerSave(updated);
        setEncounter({
          pokemon,
          level,
          phase: "appeared",
          message: t.game.wildEncounter(formatPokemonName(pokemon.name)),
        });
      }).catch(console.error).finally(() => setLoadingEncounter(false));
    }
  }, [router, searchParams, t]);

  const startEncounter = useCallback(async () => {
    if (!playerSave) return;
    setLoadingEncounter(true);
    setEncounter(null);

    try {
      const area = getArea(playerSave.currentAreaId);
      const pokemonId = pickWildPokemonId(area);
      const level = pickWildLevel(area);

      const pokemon = await fetchPokemonDetail(String(pokemonId));

      // Mark as seen
      const updated = playerState.markSeen(playerSave, pokemon.id);
      setPlayerSave(updated);

      setEncounter({
        pokemon,
        level,
        phase: "appeared",
        message: t.game.wildEncounter(formatPokemonName(pokemon.name)),
      });
    } catch (err) {
      console.error("Failed to load wild Pokemon", err);
    } finally {
      setLoadingEncounter(false);
    }
  }, [playerSave, t]);

  const handleThrowBall = useCallback(() => {
    if (!encounter || !playerSave) return;

    const { ok, state: afterSpend } = playerState.spendPokeball(playerSave);
    if (!ok) {
      setEncounter((e) => e ? { ...e, phase: "no_balls", message: t.game.noPokeballsTitle } : e);
      return;
    }
    setPlayerSave(afterSpend);

    setEncounter((e) => e ? { ...e, phase: "throwing", message: "..." } : e);

    // Simulate throw delay
    setTimeout(() => {
      if (!encounter) return;

      const area = getArea(afterSpend.currentAreaId);
      const result = attemptCatch(
        encounter.pokemon.id,
        encounter.level * 10,  // simplified HP proxy
        encounter.level * 12,
        area
      );

      setEncounter((e) => e ? { ...e, phase: "shaking" } : e);

      setTimeout(() => {
        if (result.success) {
          const owned = createOwnedPokemon(encounter.pokemon, encounter.level, afterSpend.currentAreaId);
          const afterCatch = playerState.addPokemon(afterSpend, owned);
          setPlayerSave(afterCatch);

          const isBoxed = afterSpend.party.length >= playerState.MAX_PARTY_SIZE;
          const successMsg = isBoxed
            ? t.game.catchBoxed(formatPokemonName(encounter.pokemon.name))
            : t.game.catchAdded(formatPokemonName(encounter.pokemon.name), "Pallet Town");

          setEncounter((e) =>
            e ? { ...e, phase: "caught", message: successMsg } : e
          );
        } else {
          setEncounter((e) =>
            e ? { ...e, phase: "fled", message: t.game.catchFail } : e
          );
        }
      }, 1200); // shaking duration
    }, 600); // throw arc duration
  }, [encounter, playerSave, t]);

  const handleFlee = () => {
    setEncounter(null);
  };

  if (!playerSave) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  const pokeballs = playerSave.pokeballs;

  return (
    <>
      <style>{SHAKE_KEYFRAMES}</style>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.game.wildTitle}</h1>
            <p className="text-gray-500 text-sm">{t.game.wildSubtitle}</p>
          </div>
          <Link
            href="/party"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            ← Party
          </Link>
        </div>

        {/* Pokeball count */}
        <div className="flex items-center gap-2 mb-6 bg-white rounded-xl border border-gray-200 px-4 py-2.5">
          <span className="text-xl">🎾</span>
          <span className="text-sm font-semibold text-gray-700">
            {t.game.pokeballsLeft(pokeballs)}
          </span>
        </div>

        {/* Encounter area */}
        <div className="bg-gradient-to-b from-green-50 to-green-100 rounded-3xl border border-green-200 p-8 min-h-[340px] flex flex-col items-center justify-center gap-6">

          {/* No encounter yet */}
          {!encounter && !loadingEncounter && (
            <div className="text-center space-y-4">
              <div className="text-6xl">🌿</div>
              <p className="text-gray-600 font-medium">
                The tall grass rustles...
              </p>
              <button
                onClick={startEncounter}
                className="px-8 py-3 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 hover:scale-105 transition-all shadow-md"
                type="button"
              >
                Walk into the grass!
              </button>
            </div>
          )}

          {/* Loading */}
          {loadingEncounter && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-green-300 border-t-green-600 rounded-full animate-spin" />
              <p className="text-green-700 font-medium">Something is coming...</p>
            </div>
          )}

          {/* Encounter */}
          {encounter && (
            <div className="w-full flex flex-col items-center gap-4">
              {/* Pokemon */}
              <WildPokemonDisplay
                pokemon={encounter.pokemon}
                level={encounter.level}
                shaking={encounter.phase === "shaking"}
              />

              {/* Message box */}
              <div className="w-full bg-white rounded-xl border border-gray-200 px-4 py-3 text-center">
                <p className="font-semibold text-gray-800 text-sm">{encounter.message}</p>
              </div>

              {/* Pokeball throw animation */}
              {encounter.phase === "throwing" && (
                <div className="text-4xl animate-bounce">🎾</div>
              )}

              {/* Shaking Pokeball */}
              {encounter.phase === "shaking" && (
                <div className="text-4xl pokeball-shake">🎾</div>
              )}

              {/* Actions */}
              {encounter.phase === "appeared" && (
                <div className="flex gap-3 w-full">
                  <button
                    onClick={handleThrowBall}
                    disabled={pokeballs <= 0}
                    className="flex-1 py-3 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow"
                    type="button"
                  >
                    {t.game.throwBall}
                  </button>
                  <button
                    onClick={handleFlee}
                    className="px-6 py-3 bg-gray-100 text-gray-600 font-semibold rounded-full hover:bg-gray-200 transition-colors"
                    type="button"
                  >
                    {t.game.flee}
                  </button>
                </div>
              )}

              {/* Post-result actions */}
              {(encounter.phase === "caught" || encounter.phase === "fled") && (
                <div className="flex gap-3 w-full">
                  <button
                    onClick={startEncounter}
                    disabled={pokeballs <= 0 && encounter.phase !== "fled"}
                    className="flex-1 py-3 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 transition-colors shadow"
                    type="button"
                  >
                    Walk again!
                  </button>
                  <Link
                    href="/party"
                    className="px-6 py-3 bg-gray-100 text-gray-600 font-semibold rounded-full hover:bg-gray-200 transition-colors text-center"
                  >
                    Party
                  </Link>
                </div>
              )}

              {encounter.phase === "no_balls" && (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm text-gray-500">{t.game.noPokeballsText}</p>
                  <Link
                    href="/party"
                    className="px-6 py-3 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition-colors"
                  >
                    Back to Party
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pokedex stats */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-2xl font-bold text-gray-800">{playerSave.seen.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t.game.seen}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-2xl font-bold text-gray-800">{playerSave.caught.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t.game.caught}</p>
          </div>
        </div>
      </div>
    </>
  );
}

// Wrap in Suspense because useSearchParams() requires it for static builds
export default function WildPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
      </div>
    }>
      <WildPageInner />
    </Suspense>
  );
}
