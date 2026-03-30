"use client";

import { useRef, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/index";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBox({ value, onChange, placeholder }: SearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const resolvedPlaceholder = placeholder || t.search.placeholder;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative w-full max-w-md">
      <svg
        className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={resolvedPlaceholder}
        className="w-full ps-10 pe-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent placeholder-gray-400"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          type="button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
