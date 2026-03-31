"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PokemonCardData } from "@/lib/types";
import { fetchPokemonList, formatPokemonName, StatFilterParam } from "@/lib/api-client";
import { STAT_COLORS } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/index";
import TypeBadge from "@/components/TypeBadge";

/* ─── Constants ─────────────────────────────────────────────────── */

const STAT_KEYS = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
const STAT_MAXES: Record<string, number> = {
  hp: 255,
  attack: 190,
  defense: 230,
  "special-attack": 194,
  "special-defense": 230,
  speed: 200,
  total: 720,
};
const RESULTS_LIMIT = 10;

interface StatRange {
  min: number;
  max: number;
}

type RangeMap = Record<string, StatRange>;

function defaultRanges(): RangeMap {
  const m: RangeMap = {};
  for (const k of STAT_KEYS) {
    m[k] = { min: 0, max: STAT_MAXES[k] };
  }
  m.total = { min: 0, max: STAT_MAXES.total };
  return m;
}

/* ─── Range slider component ────────────────────────────────────── */

function StatRangeSlider({
  statKey,
  label,
  range,
  onChange,
}: {
  statKey: string;
  label: string;
  range: StatRange;
  onChange: (key: string, range: StatRange) => void;
}) {
  const max = STAT_MAXES[statKey];
  const color = STAT_COLORS[statKey] || "bg-gray-400";
  const { t } = useTranslation();

  // The filled portion percentage
  const leftPct = (range.min / max) * 100;
  const rightPct = (range.max / max) * 100;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-500">
          {range.min} – {range.max}
        </span>
      </div>

      {/* Track with filled range */}
      <div className="relative h-2 bg-gray-100 rounded-full">
        <div
          className={`absolute h-full rounded-full ${color} opacity-40`}
          style={{ left: `${leftPct}%`, width: `${rightPct - leftPct}%` }}
        />
      </div>

      {/* Min / Max inputs */}
      <div className="flex items-center gap-2">
        <label className="text-[10px] text-gray-400 uppercase">{t.statsExplorer.min}</label>
        <input
          type="number"
          min={0}
          max={range.max}
          value={range.min}
          onChange={(e) => {
            const v = Math.max(0, Math.min(parseInt(e.target.value) || 0, range.max));
            onChange(statKey, { ...range, min: v });
          }}
          className="w-16 px-2 py-1 text-xs text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-300"
        />
        <div className="flex-1" />
        <label className="text-[10px] text-gray-400 uppercase">{t.statsExplorer.max}</label>
        <input
          type="number"
          min={range.min}
          max={max}
          value={range.max}
          onChange={(e) => {
            const v = Math.max(range.min, Math.min(parseInt(e.target.value) || 0, max));
            onChange(statKey, { ...range, max: v });
          }}
          className="w-16 px-2 py-1 text-xs text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-300"
        />
      </div>
    </div>
  );
}

/* ─── Result card ───────────────────────────────────────────────── */

function StatResultCard({
  pokemon,
  rank,
  sortBy,
}: {
  pokemon: PokemonCardData;
  rank: number;
  sortBy: string;
}) {
  const { t } = useTranslation();

  // Calculate displayed stat value
  let statValue: number | null = null;
  let statLabel = "";

  if (pokemon.stats) {
    if (sortBy === "total") {
      statValue = pokemon.stats.reduce((sum, s) => sum + s.base_stat, 0);
      statLabel = t.statsExplorer.total;
    } else {
      const found = pokemon.stats.find((s) => s.name === sortBy);
      if (found) {
        statValue = found.base_stat;
        statLabel = t.stats[sortBy] || sortBy;
      }
    }
  }

  const color = STAT_COLORS[sortBy] || "bg-gray-400";

  return (
    <Link
      href={`/pokemon/${pokemon.id}`}
      className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md hover:scale-[1.01] transition-all"
    >
      {/* Rank */}
      <span className="text-lg font-bold text-gray-300 w-8 text-center shrink-0">
        {rank}
      </span>

      {/* Sprite */}
      {pokemon.sprite ? (
        <img
          src={pokemon.sprite}
          alt={pokemon.name}
          width={56}
          height={56}
          className="w-14 h-14 image-rendering-pixelated shrink-0"
        />
      ) : (
        <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
          ?
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-800 text-sm truncate">
            {formatPokemonName(pokemon.name)}
          </p>
          <span className="text-[10px] text-gray-400 font-mono shrink-0">
            #{pokemon.id.toString().padStart(4, "0")}
          </span>
        </div>
        <div className="flex gap-1 mt-1">
          {pokemon.types.map((type) => (
            <TypeBadge key={type} type={type} />
          ))}
        </div>
      </div>

      {/* Stat badge */}
      {statValue !== null && (
        <div className="flex flex-col items-center shrink-0">
          <span className="text-[10px] text-gray-400 uppercase">{statLabel}</span>
          <span
            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-white text-sm font-bold ${color}`}
          >
            {statValue}
          </span>
        </div>
      )}
    </Link>
  );
}

/* ─── Main page ─────────────────────────────────────────────────── */

export default function StatsExplorerPage() {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState("total");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [ranges, setRanges] = useState<RangeMap>(defaultRanges);
  const [results, setResults] = useState<PokemonCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleRangeChange = (key: string, range: StatRange) => {
    setRanges((prev) => ({ ...prev, [key]: range }));
  };

  const handleReset = () => {
    setRanges(defaultRanges());
    setSortBy("total");
    setSortOrder("desc");
  };

  // Build stat filters from ranges (only include non-default ranges)
  const buildStatFilters = useCallback((): StatFilterParam[] => {
    const filters: StatFilterParam[] = [];
    for (const key of [...STAT_KEYS, "total"]) {
      const r = ranges[key];
      const maxVal = STAT_MAXES[key];
      if (r.min > 0 || r.max < maxVal) {
        filters.push({
          name: key,
          min: r.min > 0 ? r.min : undefined,
          max: r.max < maxVal ? r.max : undefined,
        });
      }
    }
    return filters;
  }, [ranges]);

  // Fetch results when any parameter changes (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const statFilters = buildStatFilters();
        const result = await fetchPokemonList({
          offset: 0,
          limit: RESULTS_LIMIT,
          sortBy,
          sortOrder,
          statFilters: statFilters.length > 0 ? statFilters : undefined,
          includeStats: true,
        });
        setResults(result.pokemon);
        setTotal(result.total);
      } catch (err) {
        console.error("Failed to load stats:", err);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [sortBy, sortOrder, buildStatFilters]);

  const sortOptions = [
    ...STAT_KEYS.map((k) => ({ value: k, label: t.stats[k] || k })),
    { value: "total", label: t.statsExplorer.total },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {t.statsExplorer.title}
        </h1>
        <p className="text-gray-500 mt-1">{t.statsExplorer.subtitle}</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        {/* Sort controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              {t.statsExplorer.sortBy}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              {t.statsExplorer.sortOrder}
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              <option value="desc">{t.statsExplorer.highest}</option>
              <option value="asc">{t.statsExplorer.lowest}</option>
            </select>
          </div>
        </div>

        {/* Stat range filters */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {t.statsExplorer.statRanges}
          </h3>
          <button
            onClick={handleReset}
            className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
            type="button"
          >
            {t.statsExplorer.reset}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {STAT_KEYS.map((key) => (
            <StatRangeSlider
              key={key}
              statKey={key}
              label={t.stats[key] || key}
              range={ranges[key]}
              onChange={handleRangeChange}
            />
          ))}
          {/* Total stat */}
          <div className="sm:col-span-2">
            <StatRangeSlider
              statKey="total"
              label={t.statsExplorer.total}
              range={ranges.total}
              onChange={handleRangeChange}
            />
          </div>
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">
          {loading ? "..." : t.statsExplorer.results(results.length, total)}
        </p>
      </div>

      {/* Results */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-red-200 border-t-red-500 rounded-full animate-spin" />
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">{t.statsExplorer.noResults}</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map((pokemon, i) => (
            <StatResultCard
              key={pokemon.id}
              pokemon={pokemon}
              rank={i + 1}
              sortBy={sortBy}
            />
          ))}
        </div>
      )}
    </div>
  );
}
