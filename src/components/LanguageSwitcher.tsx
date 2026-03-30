"use client";

import { useTranslation, type Language } from "@/lib/i18n/index";

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation();

  const languages: { code: Language; label: string }[] = [
    { code: "en", label: t.language.en },
    { code: "he", label: t.language.he },
  ];

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            language === lang.code
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
          type="button"
          aria-label={`${t.language.switchLabel}: ${lang.label}`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
