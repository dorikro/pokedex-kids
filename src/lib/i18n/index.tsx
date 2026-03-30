"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { en } from "./en";
import { he } from "./he";
import type { TranslationDictionary } from "./en";

export type Language = "en" | "he";

const dictionaries: Record<Language, TranslationDictionary> = { en, he };

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationDictionary;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => {},
  t: en,
  dir: "ltr",
});

const STORAGE_KEY = "pokedex-kids-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  // Load saved language preference on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved && (saved === "en" || saved === "he")) {
        setLanguageState(saved);
      }
    } catch {
      // localStorage may not be available
    }
  }, []);

  // Update <html> lang and dir attributes when language changes
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "he" ? "rtl" : "ltr";
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // localStorage may not be available
    }
  }, []);

  const value: LanguageContextValue = {
    language,
    setLanguage,
    t: dictionaries[language],
    dir: language === "he" ? "rtl" : "ltr",
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}

// Re-export types
export type { TranslationDictionary };
