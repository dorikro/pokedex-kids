"use client";

import { TYPE_COLORS } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/index";

interface TypeBadgeProps {
  type: string;
  size?: "sm" | "md";
  onClick?: () => void;
  selected?: boolean;
}

export default function TypeBadge({ type, size = "sm", onClick, selected }: TypeBadgeProps) {
  const colors = TYPE_COLORS[type] || { bg: "bg-gray-200", text: "text-gray-800", border: "border-gray-300" };
  const { t } = useTranslation();

  const displayName = t.types[type] || type;

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  const baseClasses = `inline-block rounded-full font-medium capitalize border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses}`;

  const interactiveClasses = onClick
    ? `cursor-pointer transition-all ${
        selected ? "ring-2 ring-offset-1 ring-gray-800 scale-105" : "opacity-70 hover:opacity-100"
      }`
    : "";

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} ${interactiveClasses}`}
        type="button"
      >
        {displayName}
      </button>
    );
  }

  return <span className={baseClasses}>{displayName}</span>;
}
