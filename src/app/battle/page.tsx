"use client";

import { useState, useEffect, useRef } from "react";
import { LocalPokemon } from "@/lib/types";
import { fetchPokemonDetail, formatPokemonName } from "@/lib/api-client";
import { calculateBattle, BattleResult } from "@/lib/battle";
import { useTranslation } from "@/lib/i18n/index";
import { STAT_COLORS } from "@/lib/constants";
import TypeBadge from "@/components/TypeBadge";

/* ─── Mini stat bars shown inside each picker card ──────────────── */

function MiniStatBars({ pokemon }: { pokemon: LocalPokemon }) {
  const { t } = useTranslation();

  return (
    <div className="w-full flex flex-col gap-1 mt-2">
      {pokemon.stats.map((stat) => {
        const pct = Math.min((stat.base_stat / 255) * 100, 100);
        const color = STAT_COLORS[stat.name] || "bg-gray-400";
        const label = t.stats[stat.name] || stat.name;

        return (
          <div key={stat.name} className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500 w-12 text-end truncate">
              {label}
            </span>
            <span className="text-[10px] font-semibold text-gray-700 w-6 text-end">
              {stat.base_stat}
            </span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Pokemon picker ────────────────────────────────────────────── */

interface PokemonPickerProps {
  label: string;
  pokemon: LocalPokemon | null;
  onSelect: (pokemon: LocalPokemon) => void;
  error: string | null;
  searchPlaceholder: string;
  searchNotFound: string;
  emptyPrompt: string;
}

function PokemonPicker({
  label,
  pokemon,
  onSelect,
  error,
  searchPlaceholder,
  searchNotFound,
  emptyPrompt,
}: PokemonPickerProps) {
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
        setSearchError(searchNotFound);
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
        placeholder={searchPlaceholder}
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
          {/* Mini stat bars */}
          <MiniStatBars pokemon={pokemon} />
        </div>
      )}
      {!pokemon && !loading && !searchError && (
        <div className="flex flex-col items-center justify-center w-full max-w-[220px] h-48 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-300 text-4xl mb-2">?</p>
          <p className="text-gray-400 text-xs">{emptyPrompt}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Type effectiveness label ──────────────────────────────────── */

function EffectivenessLabel({
  multiplier,
  t,
}: {
  multiplier: number;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  if (multiplier === 0) {
    return (
      <span className="text-sm font-semibold text-gray-400">
        {t.battle.noEffect} (0x)
      </span>
    );
  }
  if (multiplier > 1) {
    return (
      <span className="text-sm font-semibold text-green-600">
        {t.battle.superEffective} ({multiplier}x)
      </span>
    );
  }
  if (multiplier < 1) {
    return (
      <span className="text-sm font-semibold text-red-500">
        {t.battle.notVeryEffective} ({multiplier}x)
      </span>
    );
  }
  return (
    <span className="text-sm font-semibold text-gray-500">
      {t.battle.neutral} (1x)
    </span>
  );
}

/* ─── Side-by-side stat comparison bar ──────────────────────────── */

function StatComparisonRow({
  statName,
  value1,
  value2,
  translatedName,
}: {
  statName: string;
  value1: number;
  value2: number;
  translatedName: string;
}) {
  const max = Math.max(value1, value2, 1);
  const pct1 = (value1 / max) * 100;
  const pct2 = (value2 / max) * 100;
  const color = STAT_COLORS[statName] || "bg-gray-400";

  const winner = value1 > value2 ? 1 : value2 > value1 ? 2 : 0;

  return (
    <div className="flex items-center gap-2">
      {/* Pokemon 1 value */}
      <span
        className={`text-xs font-bold w-8 text-end ${
          winner === 1 ? "text-green-600" : winner === 2 ? "text-red-500" : "text-gray-600"
        }`}
      >
        {value1}
      </span>

      {/* Pokemon 1 bar (right-aligned, grows left) */}
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden flex justify-end">
        <div
          className={`h-full rounded-full ${color} ${
            winner === 1 ? "opacity-100" : "opacity-50"
          }`}
          style={{ width: `${pct1}%` }}
        />
      </div>

      {/* Stat label */}
      <span className="text-[11px] font-medium text-gray-600 w-14 text-center shrink-0">
        {translatedName}
      </span>

      {/* Pokemon 2 bar (left-aligned, grows right) */}
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} ${
            winner === 2 ? "opacity-100" : "opacity-50"
          }`}
          style={{ width: `${pct2}%` }}
        />
      </div>

      {/* Pokemon 2 value */}
      <span
        className={`text-xs font-bold w-8 ${
          winner === 2 ? "text-green-600" : winner === 1 ? "text-red-500" : "text-gray-600"
        }`}
      >
        {value2}
      </span>
    </div>
  );
}

/* ─── Detailed battle breakdown ─────────────────────────────────── */

function BattleBreakdownSection({ result }: { result: BattleResult }) {
  const { t } = useTranslation();
  const { breakdown, pokemon1, pokemon2 } = result;
  const name1 = formatPokemonName(pokemon1.name);
  const name2 = formatPokemonName(pokemon2.name);

  return (
    <div className="mt-6 bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-6">
      <h3 className="text-lg font-bold text-gray-800 text-center">
        {t.battle.breakdown}
      </h3>

      {/* ── Stat comparison ───────────────────────────────── */}
      <div>
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
          {t.battle.statComparison}
        </h4>

        {/* Names header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-gray-700 w-8 text-end">&nbsp;</span>
          <div className="flex-1 text-end">
            <span className="text-xs font-semibold text-gray-600">{name1}</span>
          </div>
          <span className="w-14 text-center shrink-0">&nbsp;</span>
          <div className="flex-1">
            <span className="text-xs font-semibold text-gray-600">{name2}</span>
          </div>
          <span className="text-xs font-bold text-gray-700 w-8">&nbsp;</span>
        </div>

        <div className="space-y-1.5">
          {breakdown.statComparisons.map((sc) => (
            <StatComparisonRow
              key={sc.name}
              statName={sc.name}
              value1={sc.stat1}
              value2={sc.stat2}
              translatedName={t.stats[sc.name] || sc.name}
            />
          ))}
        </div>

        {/* Stats won summary */}
        <div className="flex justify-between mt-3 text-xs text-gray-500">
          <span>{t.battle.winsStatCount(name1, breakdown.statsWon1, 6)}</span>
          <span>{t.battle.winsStatCount(name2, breakdown.statsWon2, 6)}</span>
        </div>
      </div>

      {/* ── Totals & type effectiveness ───────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
            {t.battle.totalStats}
          </h4>
          <div className="flex justify-between items-end">
            <div className="text-center flex-1">
              <p className="text-xs text-gray-500 mb-1">{name1}</p>
              <p
                className={`text-2xl font-bold ${
                  breakdown.totalStats1 >= breakdown.totalStats2
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              >
                {breakdown.totalStats1}
              </p>
            </div>
            <span className="text-gray-300 text-lg font-bold px-2">vs</span>
            <div className="text-center flex-1">
              <p className="text-xs text-gray-500 mb-1">{name2}</p>
              <p
                className={`text-2xl font-bold ${
                  breakdown.totalStats2 >= breakdown.totalStats1
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              >
                {breakdown.totalStats2}
              </p>
            </div>
          </div>
        </div>

        {/* Type effectiveness */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
            {t.battle.typeEffectiveness}
          </h4>
          <div className="flex justify-between items-start">
            <div className="text-center flex-1">
              <p className="text-xs text-gray-500 mb-1">
                {name1} vs {name2}
              </p>
              <EffectivenessLabel multiplier={breakdown.typeMultiplier1vs2} t={t} />
            </div>
            <div className="text-center flex-1">
              <p className="text-xs text-gray-500 mb-1">
                {name2} vs {name1}
              </p>
              <EffectivenessLabel multiplier={breakdown.typeMultiplier2vs1} t={t} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Adjusted scores ───────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
          {t.battle.adjustedScore}
        </h4>
        <p className="text-[11px] text-gray-400 text-center mb-3">
          {t.battle.totalStats} x {t.battle.typeEffectiveness}
        </p>
        <div className="flex justify-between items-end">
          <div className="text-center flex-1">
            <p className="text-xs text-gray-500 mb-1">{name1}</p>
            <p
              className={`text-2xl font-bold ${
                breakdown.adjustedScore1 >= breakdown.adjustedScore2
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              {breakdown.adjustedScore1}
            </p>
          </div>
          <span className="text-gray-300 text-lg font-bold px-2">vs</span>
          <div className="text-center flex-1">
            <p className="text-xs text-gray-500 mb-1">{name2}</p>
            <p
              className={`text-2xl font-bold ${
                breakdown.adjustedScore2 >= breakdown.adjustedScore1
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              {breakdown.adjustedScore2}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main battle page ──────────────────────────────────────────── */

export default function BattlePage() {
  const [pokemon1, setPokemon1] = useState<LocalPokemon | null>(null);
  const [pokemon2, setPokemon2] = useState<LocalPokemon | null>(null);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [battleTriggered, setBattleTriggered] = useState(false);
  const { t } = useTranslation();

  // Reset result when Pokemon change
  useEffect(() => {
    setResult(null);
    setBattleTriggered(false);
  }, [pokemon1, pokemon2]);

  const handleBattle = () => {
    if (!pokemon1 || !pokemon2) return;
    if (pokemon1.id === pokemon2.id) return;
    const res = calculateBattle(pokemon1, pokemon2, t);
    setResult(res);
    setBattleTriggered(true);
  };

  const canBattle = pokemon1 && pokemon2 && pokemon1.id !== pokemon2.id;
  const samePokemon = pokemon1 && pokemon2 && pokemon1.id === pokemon2.id;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t.battle.title}</h1>
        <p className="text-gray-500 mt-1">{t.battle.subtitle}</p>
      </div>

      {/* Pickers */}
      <div className="flex flex-col sm:flex-row gap-6 items-start justify-center mb-8">
        <PokemonPicker
          label={t.battle.pokemon1}
          pokemon={pokemon1}
          onSelect={setPokemon1}
          error={null}
          searchPlaceholder={t.battle.searchPlaceholder}
          searchNotFound={t.battle.searchNotFound}
          emptyPrompt={t.battle.typeNameOrNumber}
        />
        <div className="flex items-center justify-center self-center text-3xl font-bold text-gray-300 py-4">
          {t.battle.vs}
        </div>
        <PokemonPicker
          label={t.battle.pokemon2}
          pokemon={pokemon2}
          onSelect={setPokemon2}
          error={null}
          searchPlaceholder={t.battle.searchPlaceholder}
          searchNotFound={t.battle.searchNotFound}
          emptyPrompt={t.battle.typeNameOrNumber}
        />
      </div>

      {/* Same pokemon warning */}
      {samePokemon && (
        <p className="text-center text-sm text-amber-600 mb-4">
          {t.battle.samePokemon}
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
          {t.battle.fight}
        </button>
      </div>

      {/* Result */}
      {result && battleTriggered && (
        <>
          {/* Winner announcement */}
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
                  <p className="text-xl font-bold text-amber-500">
                    {t.battle.closeMatch}
                  </p>
                ) : (
                  <p className="text-xl font-bold text-green-600">
                    {t.battle.wins(formatPokemonName(result.winner.name))}
                  </p>
                )}
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed max-w-md mx-auto">
              {result.reason}
            </p>
          </div>

          {/* Detailed breakdown */}
          <BattleBreakdownSection result={result} />
        </>
      )}
    </div>
  );
}
