"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  contentByLanguage,
  languages,
  type LanguageCode,
  type WebsiteContent,
} from "@/lib/content";

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  content: WebsiteContent;
  languages: typeof languages;
}

const STORAGE_KEY = "siri-windows-language";
const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLanguageCode(value: string | null): value is LanguageCode {
  return value === "en" || value === "te" || value === "hi";
}

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window === "undefined") return "en";
    const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
    return isLanguageCode(savedLanguage) ? savedLanguage : "en";
  });

  const setLanguage = (nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    document.documentElement.lang = nextLanguage;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      content: contentByLanguage[language],
      languages,
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}

export function useContent() {
  return useLanguage().content;
}
