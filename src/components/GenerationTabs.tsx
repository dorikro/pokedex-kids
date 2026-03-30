"use client";

import { GENERATIONS } from "@/lib/constants";

interface GenerationTabsProps {
  selected: number | null; // generation id or null for "All"
  onSelect: (genId: number | null) => void;
}

export default function GenerationTabs({ selected, onSelect }: GenerationTabsProps) {
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
        All
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
          {gen.label}
        </button>
      ))}
    </div>
  );
}
