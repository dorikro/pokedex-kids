"use client";

/**
 * WildEncounterOverlay
 *
 * A floating bottom sheet that appears while browsing the Pokedex
 * when a "wild encounter" is randomly triggered. The player can choose
 * to catch it (redirects to /wild with the specific Pokemon pre-loaded)
 * or ignore it.
 *
 * Trigger probability: ~5% per page scroll event (throttled to once per 8s).
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { playerState } from "@/lib/player-state";
import { getArea } from "@/lib/areas";
import { pickWildPokemonId, pickWildLevel } from "@/lib/catch";
import { formatPokemonName } from "@/lib/api-client";
import { useTranslation } from "@/lib/i18n/index";
import TypeBadge from "@/components/TypeBadge";

// Probability of triggering an encounter on any given scroll tick
const ENCOUNTER_CHANCE = 0.05;
// Minimum ms between encounter checks
const COOLDOWN_MS = 8_000;

interface MiniPokemon {
  id: number;
  name: string;
  sprite: string | null;
  types: string[];
  level: number;
}

export default function WildEncounterOverlay() {
  const router = useRouter();
  const { t } = useTranslation();
  const [encounter, setEncounter] = useState<MiniPokemon | null>(null);
  const [visible, setVisible] = useState(false);
  const lastCheckRef = useRef<number>(0);
  const hasStarted = useRef(false);

  // Only activate if the player has started the game
  useEffect(() => {
    const s = playerState.get();
    hasStarted.current = s.hasStarted;
  }, []);

  const triggerEncounter = useCallback(async () => {
    if (!hasStarted.current) return;
    const now = Date.now();
    if (now - lastCheckRef.current < COOLDOWN_MS) return;
    lastCheckRef.current = now;

    if (Math.random() > ENCOUNTER_CHANCE) return;

    try {
      const save = playerState.get();
      const area = getArea(save.currentAreaId);
      const pokemonId = pickWildPokemonId(area);
      const level = pickWildLevel(area);

      // Use PokeAPI sprite URL directly (no full fetch needed for the overlay)
      const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;

      // Fetch just enough data from our local API
      const res = await fetch(`/api/pokemon/${pokemonId}`);
      if (!res.ok) return;
      const data = await res.json();

      // Mark as seen
      const updated = playerState.markSeen(save, pokemonId);
      playerState.set(updated);

      setEncounter({
        id: pokemonId,
        name: data.name,
        sprite: data.sprite ?? spriteUrl,
        types: data.types ?? [],
        level,
      });
      setVisible(true);
    } catch {
      // Silently fail — overlay is non-critical
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      triggerEncounter();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [triggerEncounter]);

  const handleCatch = () => {
    if (!encounter) return;
    setVisible(false);
    // Pass the Pokemon ID via query param so wild page can pre-load it
    router.push(`/wild?encounter=${encounter.id}&level=${encounter.level}`);
  };

  const handleIgnore = () => {
    setVisible(false);
    setEncounter(null);
  };

  if (!visible || !encounter) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(90vw,380px)]
                 bg-white rounded-2xl border border-gray-200 shadow-2xl p-4
                 animate-slide-up"
      role="dialog"
      aria-label="Wild Pokémon encounter"
    >
      <div className="flex items-center gap-3">
        {/* Sprite */}
        {encounter.sprite ? (
          <img
            src={encounter.sprite}
            alt={formatPokemonName(encounter.name)}
            width={64}
            height={64}
            className="w-16 h-16 image-rendering-pixelated flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 flex-shrink-0">?</div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-green-600 font-semibold uppercase tracking-wide mb-0.5">
            {t.game.wildOverlayTitle}
          </p>
          <p className="font-bold text-gray-800 truncate">
            {t.game.wildOverlayText(formatPokemonName(encounter.name))}
          </p>
          <p className="text-xs text-gray-400">{t.game.level} {encounter.level}</p>
          <div className="flex gap-1 mt-1 flex-wrap">
            {encounter.types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
        </div>

        {/* Close */}
        <button
          onClick={handleIgnore}
          className="text-gray-300 hover:text-gray-500 text-xl leading-none p-1 flex-shrink-0"
          aria-label="Ignore"
          type="button"
        >
          ✕
        </button>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleCatch}
          className="flex-1 py-2 bg-red-500 text-white font-bold text-sm rounded-full hover:bg-red-600 transition-colors"
          type="button"
        >
          {t.game.wildOverlayCatch}
        </button>
        <button
          onClick={handleIgnore}
          className="px-4 py-2 bg-gray-100 text-gray-500 font-semibold text-sm rounded-full hover:bg-gray-200 transition-colors"
          type="button"
        >
          {t.game.wildOverlayIgnore}
        </button>
      </div>
    </div>
  );
}
