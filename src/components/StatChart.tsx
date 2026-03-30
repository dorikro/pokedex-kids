"use client";

import { PokemonStat } from "@/lib/types";
import { STAT_COLORS } from "@/lib/constants";
import { formatStatName } from "@/lib/api-client";

interface StatBarProps {
  stat: PokemonStat;
}

function StatBar({ stat }: StatBarProps) {
  const maxStat = 255;
  const percentage = Math.min((stat.base_stat / maxStat) * 100, 100);
  const color = STAT_COLORS[stat.stat.name] || "bg-gray-400";

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-600 w-16 text-right">
        {formatStatName(stat.stat.name)}
      </span>
      <span className="text-sm font-bold text-gray-800 w-8 text-right">
        {stat.base_stat}
      </span>
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface StatChartProps {
  stats: PokemonStat[];
}

export default function StatChart({ stats }: StatChartProps) {
  const total = stats.reduce((sum, s) => sum + s.base_stat, 0);

  return (
    <div className="flex flex-col gap-2">
      {stats.map((stat) => (
        <StatBar key={stat.stat.name} stat={stat} />
      ))}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <span className="text-sm font-medium text-gray-600 w-16 text-right">Total</span>
        <span className="text-sm font-bold text-gray-900 w-8 text-right">{total}</span>
        <div className="flex-1" />
      </div>
    </div>
  );
}
