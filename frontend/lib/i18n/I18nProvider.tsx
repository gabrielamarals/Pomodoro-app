"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { dictionaries, type Locale, type TranslationKey } from "./dictionaries";

const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void; t: (key: TranslationKey) => string } | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt-BR");
  useEffect(() => {
    const saved = localStorage.getItem("pomodoro-locale");
    const initialLocale = saved === "en" || saved === "pt-BR" ? saved : "pt-BR";
    setLocaleState(initialLocale);
    document.documentElement.lang = initialLocale;
  }, []);
  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem("pomodoro-locale", next);
    document.documentElement.lang = next;
  }, []);
  const value = useMemo(() => ({ locale, setLocale, t: (key: TranslationKey) => dictionaries[locale][key] }), [locale, setLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() { const context = useContext(LocaleContext); if (!context) throw new Error("useI18n must be used inside I18nProvider"); return context; }
