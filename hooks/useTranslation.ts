"use client";

import { useState, useEffect } from "react";
import useLanguage from "./useLanguage";

// Import translations directly from JSON files
import en from "@/localization/locales/en.json";
import am from "@/localization/locales/am.json";
import or from "@/localization/locales/or.json";

// Load translations directly from JSON files
const translations: Record<string, any> = {
  en,
  am,
  or,
};

export default function useTranslation() {
  const { currentLang } = useLanguage();
  const [translationsLoaded, setTranslationsLoaded] = useState(true);

  // Helper function to get translation value
  const t = (key: string, fallback?: string): string => {
    const keys = key.split(".");
    let value = translations[currentLang];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        // Fallback to English if translation not found
        value = translations["en"];
        for (const fallbackKey of keys) {
          if (value && typeof value === "object" && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return fallback || key;
          }
        }
        return fallback || key;
      }
    }

    return typeof value === "string" ? value : fallback || key;
  };

  return {
    t,
    translationsLoaded,
  };
}
