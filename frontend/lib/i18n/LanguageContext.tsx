"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Locale, TranslationDictionary } from "./types";
import { en } from "./en";
import { th } from "./th";

interface LanguageContextProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    // Check localStorage on client-side mount
    const savedLocale = localStorage.getItem("locale") as Locale;
    if (savedLocale === "en" || savedLocale === "th") {
      setLocaleState(savedLocale);
    } else {
      // Auto-detect browser language
      const browserLang = navigator.language.split("-")[0];
      if (browserLang === "th") {
        setLocaleState("th");
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  };

  const t = locale === "th" ? th : en;

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
