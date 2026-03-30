"use client";

import { ALL_TYPES } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/index";
import TypeBadge from "./TypeBadge";

interface TypeFilterProps {
  selectedTypes: string[];
  onToggleType: (type: string) => void;
  onClear: () => void;
}

export default function TypeFilter({ selectedTypes, onToggleType, onClear }: TypeFilterProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">{t.typeFilter.label}</span>
        {selectedTypes.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-red-500 hover:text-red-700 underline"
            type="button"
          >
            {t.typeFilter.clearAll}
          </button>
        )}
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {ALL_TYPES.map((type) => (
          <TypeBadge
            key={type}
            type={type}
            size="md"
            onClick={() => onToggleType(type)}
            selected={selectedTypes.includes(type)}
          />
        ))}
      </div>
    </div>
  );
}
