"use client";

import { speakPokemonName } from "@/lib/api-client";
import { useTranslation } from "@/lib/i18n/index";

interface SpeakButtonProps {
  name: string;
}

export default function SpeakButton({ name }: SpeakButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      onClick={() => speakPokemonName(name)}
      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-500 hover:bg-red-200 hover:text-red-600 transition-colors"
      title={t.speak.title(name)}
      type="button"
      aria-label={t.speak.ariaLabel(name)}
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
      </svg>
    </button>
  );
}
