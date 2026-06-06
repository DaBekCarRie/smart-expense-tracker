"use client";

import type { Locale } from "@/lib/i18n/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface LanguageSwitcherProps {
  value?: Locale;
  onChange?: (locale: Locale) => void;
}

export function LanguageSwitcher({ value, onChange }: LanguageSwitcherProps = {}) {
  const { locale, setLocale } = useTranslation();

  const active = value ?? locale;
  const handleSelect = (l: Locale) => {
    if (onChange) {
      onChange(l);
    } else {
      setLocale(l);
    }
  };

  return (
    <div className="flex items-center gap-1.5 p-1 border-2 border-black rounded-doodle bg-paper shadow-doodle-sm">
      <button
        type="button"
        onClick={() => handleSelect("en")}
        className={`px-3 py-1 text-sm font-bold rounded-doodle-2 transition-all border-2 ${
          active === "en"
            ? "bg-pastel-blue text-black border-black"
            : "text-gray-500 border-transparent hover:text-black hover:bg-gray-100"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => handleSelect("th")}
        className={`px-3 py-1 text-sm font-bold rounded-doodle-2 transition-all border-2 ${
          active === "th"
            ? "bg-pastel-blue text-black border-black"
            : "text-gray-500 border-transparent hover:text-black hover:bg-gray-100"
        }`}
      >
        TH
      </button>
    </div>
  );
}
