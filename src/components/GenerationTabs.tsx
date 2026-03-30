"use client";

import { GENERATIONS } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/index";

interface GenerationTabsProps {
  selected: number | null; // generation id or null for "All"
  onSelect: (genId: number | null) => void;
}

// Map generation id to translation key
const GEN_KEYS: Record<number, string> = {
  1: "genI",
  2: "genII",
  3: "genIII",
  4: "genIV",
  5: "genV",
  6: "genVI",
  7: "genVII",
  8: "genVIII",
  9: "genIX",
};

export default function GenerationTabs({ selected, onSelect }: GenerationTabsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          selected === null
            ? "bg-red-500 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
        type="button"
      >
        {t.generations.all}
      </button>
      {GENERATIONS.map((gen) => (
        <button
          key={gen.id}
          onClick={() => onSelect(gen.id)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selected === gen.id
              ? "bg-red-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          type="button"
        >
          {t.generations[GEN_KEYS[gen.id] as keyof typeof t.generations] || gen.label}
        </button>
      ))}
    </div>
  );
}
