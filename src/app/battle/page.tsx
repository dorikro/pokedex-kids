"use client";

import { useState, useEffect, useRef } from "react";
import { LocalPokemon } from "@/lib/types";
import { fetchPokemonDetail, formatPokemonName } from "@/lib/api-client";
import { calculateBattle } from "@/lib/battle";
import TypeBadge from "@/components/TypeBadge";

interface PokemonPickerProps {
  label: string;
  pokemon: LocalPokemon | null;
  onSelect: (pokemon: LocalPokemon) => void;
  error: string | null;
}

function PokemonPicker({ label, pokemon, onSelect, error }: PokemonPickerProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = async (value: string) => {
    setQuery(value);
    setSearchError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) return;

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const p = await fetchPokemonDetail(value.trim().toLowerCase());
        onSelect(p);
        setSearchError(null);
      } catch {
        setSearchError("Pokémon not found! Check the name or number.");
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col items-center gap-3 min-w-[200px]">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </h3>
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Name or number..."
        className="w-full max-w-[220px] px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm text-center focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent placeholder-gray-400"
      />
      {loading && (
        <div className="w-8 h-8 border-3 border-red-200 border-t-red-500 rounded-full animate-spin" />
      )}
      {searchError && (
        <p className="text-xs text-red-500 text-center">{searchError}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
      {pokemon && !loading && (
        <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-200 w-full max-w-[220px]">
          {pokemon.sprite ? (
            <img
              src={pokemon.sprite}
              alt={pokemon.name}
              width={96}
              height={96}
              className="w-24 h-24 image-rendering-pixelated"
            />
          ) : (
            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
              ?
            </div>
          )}
          <p className="font-semibold text-gray-800">
            {formatPokemonName(pokemon.name)}
          </p>
          <p className="text-xs text-gray-400 font-mono">
            #{pokemon.id.toString().padStart(4, "0")}
          </p>
          <div className="flex gap-1">
            {pokemon.types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
        </div>
      )}
      {!pokemon && !loading && !searchError && (
        <div className="flex flex-col items-center justify-center w-full max-w-[220px] h-48 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-300 text-4xl mb-2">?</p>
          <p className="text-gray-400 text-xs">Type a name or number</p>
        </div>
      )}
    </div>
  );
}

export default function BattlePage() {
  const [pokemon1, setPokemon1] = useState<LocalPokemon | null>(null);
  const [pokemon2, setPokemon2] = useState<LocalPokemon | null>(null);
  const [result, setResult] = useState<ReturnType<typeof calculateBattle> | null>(null);
  const [battleTriggered, setBattleTriggered] = useState(false);

  // Reset result when Pokemon change
  useEffect(() => {
    setResult(null);
    setBattleTriggered(false);
  }, [pokemon1, pokemon2]);

  const handleBattle = () => {
    if (!pokemon1 || !pokemon2) return;
    if (pokemon1.id === pokemon2.id) return;
    const res = calculateBattle(pokemon1, pokemon2);
    setResult(res);
    setBattleTriggered(true);
  };

  const canBattle = pokemon1 && pokemon2 && pokemon1.id !== pokemon2.id;
  const samePokemon = pokemon1 && pokemon2 && pokemon1.id === pokemon2.id;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Battle!</h1>
        <p className="text-gray-500 mt-1">Pick two Pokémon and see who wins</p>
      </div>

      {/* Pickers */}
      <div className="flex flex-col sm:flex-row gap-6 items-start justify-center mb-8">
        <PokemonPicker
          label="Pokémon 1"
          pokemon={pokemon1}
          onSelect={setPokemon1}
          error={null}
        />
        <div className="flex items-center justify-center self-center text-3xl font-bold text-gray-300 py-4">
          VS
        </div>
        <PokemonPicker
          label="Pokémon 2"
          pokemon={pokemon2}
          onSelect={setPokemon2}
          error={null}
        />
      </div>

      {/* Same pokemon warning */}
      {samePokemon && (
        <p className="text-center text-sm text-amber-600 mb-4">
          Pick two different Pokémon to battle!
        </p>
      )}

      {/* Battle button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={handleBattle}
          disabled={!canBattle}
          className={`px-8 py-3 rounded-full text-lg font-bold transition-all ${
            canBattle
              ? "bg-red-500 text-white hover:bg-red-600 hover:scale-105 shadow-lg"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          type="button"
        >
          Fight!
        </button>
      </div>

      {/* Result */}
      {result && battleTriggered && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center animate-fade-in">
          <div className="flex items-center justify-center gap-4 mb-4">
            {/* Winner sprite */}
            {result.winner.sprite && (
              <img
                src={result.winner.sprite}
                alt={result.winner.name}
                width={96}
                height={96}
                className="w-24 h-24 image-rendering-pixelated"
              />
            )}
            <div>
              {result.isTie ? (
                <p className="text-xl font-bold text-amber-500">Close Match!</p>
              ) : (
                <p className="text-xl font-bold text-green-600">
                  {formatPokemonName(result.winner.name)} Wins!
                </p>
              )}
            </div>
          </div>
          <p className="text-gray-600 leading-relaxed max-w-md mx-auto">
            {result.reason}
          </p>
        </div>
      )}
    </div>
  );
}
