"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchPokemonDetail, formatPokemonName } from "@/lib/api-client";
import { playerState, createOwnedPokemon } from "@/lib/player-state";
import { useTranslation } from "@/lib/i18n/index";
import type { LocalPokemon } from "@/lib/types";
import TypeBadge from "@/components/TypeBadge";

// ─── Gen 1 starter Pokedex IDs ────────────────────────────────────────────────
const STARTER_IDS = [1, 4, 7]; // Bulbasaur, Charmander, Squirtle

// ─── Starter card ─────────────────────────────────────────────────────────────

function StarterCard({
  pokemon,
  selected,
  onSelect,
}: {
  pokemon: LocalPokemon;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onSelect}
      className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all cursor-pointer w-full max-w-[200px]
        ${selected
          ? "border-red-500 bg-red-50 shadow-lg scale-105"
          : "border-gray-200 bg-white hover:border-red-300 hover:shadow-md hover:scale-102"
        }`}
      type="button"
      aria-pressed={selected}
    >
      {pokemon.artwork ? (
        <img
          src={pokemon.artwork}
          alt={formatPokemonName(pokemon.name)}
          width={120}
          height={120}
          className="w-28 h-28 object-contain drop-shadow-md"
        />
      ) : (
        <div className="w-28 h-28 bg-gray-100 rounded-full flex items-center justify-center text-4xl">
          ?
        </div>
      )}

      <div className="text-center">
        <p className="text-xs text-gray-400 font-mono mb-0.5">
          #{pokemon.id.toString().padStart(4, "0")}
        </p>
        <p className="font-bold text-gray-800 text-lg">
          {formatPokemonName(pokemon.name)}
        </p>
      </div>

      <div className="flex gap-1.5 flex-wrap justify-center">
        {pokemon.types.map((type) => (
          <TypeBadge key={type} type={type} />
        ))}
      </div>

      {/* Base stat summary */}
      <div className="w-full space-y-1 mt-1">
        {pokemon.stats.slice(0, 3).map((stat) => (
          <div key={stat.name} className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400 w-14 text-end truncate capitalize">
              {stat.name === "special-attack" ? "Sp.Atk"
                : stat.name === "special-defense" ? "Sp.Def"
                : stat.name}
            </span>
            <span className="text-[10px] font-semibold text-gray-600 w-5 text-end">
              {stat.base_stat}
            </span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${selected ? "bg-red-400" : "bg-gray-300"}`}
                style={{ width: `${Math.min((stat.base_stat / 120) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <span
        className={`mt-1 text-sm font-semibold px-4 py-1 rounded-full transition-colors ${
          selected ? "bg-red-500 text-white" : "bg-gray-100 text-gray-500"
        }`}
      >
        {selected ? "✓ " : ""}{t.game.starterChoose}
      </span>
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StartPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [starters, setStarters] = useState<LocalPokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [trainerName, setTrainerName] = useState("");
  const [confirming, setConfirming] = useState(false);

  // If player has already started, redirect to party
  useEffect(() => {
    const state = playerState.get();
    if (state.hasStarted) {
      router.replace("/party");
    }
  }, [router]);

  // Load starter data
  useEffect(() => {
    async function load() {
      try {
        const results = await Promise.all(
          STARTER_IDS.map((id) => fetchPokemonDetail(String(id)))
        );
        setStarters(results);
      } catch (err) {
        console.error("Failed to load starters", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const selectedPokemon = starters.find((p) => p.id === selectedId) ?? null;
  const canConfirm = selectedPokemon !== null && trainerName.trim().length >= 2;

  const handleConfirm = () => {
    if (!selectedPokemon || !canConfirm) return;
    setConfirming(true);

    const owned = createOwnedPokemon(selectedPokemon, 5, "starter");
    const state = playerState.get();
    playerState.completeStarterSelection(state, owned, trainerName.trim());

    // Small delay so the button animation plays
    setTimeout(() => {
      router.push("/party");
    }, 600);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="text-6xl mb-4">🎮</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t.game.starterTitle}
        </h1>
        <p className="text-gray-500">{t.game.starterSubtitle}</p>
      </div>

      {/* Trainer name */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <label
          htmlFor="trainer-name"
          className="text-sm font-semibold text-gray-600"
        >
          {t.game.trainerNameLabel}
        </label>
        <input
          id="trainer-name"
          type="text"
          value={trainerName}
          onChange={(e) => setTrainerName(e.target.value)}
          placeholder={t.game.trainerNamePlaceholder}
          maxLength={16}
          className="w-full max-w-xs px-4 py-2.5 rounded-xl border border-gray-200 text-center text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent placeholder-gray-400"
        />
      </div>

      {/* Starter cards */}
      <div className="flex flex-col sm:flex-row gap-6 justify-center items-start mb-10">
        {starters.map((pokemon) => (
          <StarterCard
            key={pokemon.id}
            pokemon={pokemon}
            selected={selectedId === pokemon.id}
            onSelect={() => setSelectedId(pokemon.id)}
          />
        ))}
      </div>

      {/* Confirm button */}
      <div className="flex justify-center">
        <button
          onClick={handleConfirm}
          disabled={!canConfirm || confirming}
          className={`px-10 py-3.5 rounded-full text-lg font-bold transition-all ${
            canConfirm && !confirming
              ? "bg-red-500 text-white hover:bg-red-600 hover:scale-105 shadow-lg"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          type="button"
        >
          {confirming ? "..." : t.game.starterConfirm}
        </button>
      </div>

      {!canConfirm && (
        <p className="text-center text-sm text-gray-400 mt-3">
          {trainerName.trim().length < 2
            ? "Enter a name (at least 2 characters)"
            : "Choose a starter Pokémon"}
        </p>
      )}
    </div>
  );
}
