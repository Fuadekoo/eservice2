"use client";

import { useState, useEffect, useCallback } from "react";
import useLanguage from "./useLanguage";

// Fallback translations (loaded at build time as backup)
import enFallback from "@/localization/locales/en.json";
import amFallback from "@/localization/locales/am.json";
import orFallback from "@/localization/locales/or.json";

const fallbackTranslations: Record<string, any> = {
  en: enFallback,
  am: amFallback,
  or: orFallback,
};

export default function useTranslation() {
  const { currentLang } = useLanguage();
  const [translations, setTranslations] = useState<Record<string, any>>(
    fallbackTranslations
  );
  const [translationsLoaded, setTranslationsLoaded] = useState(false);

  // Load translations dynamically from API
  useEffect(() => {
    let isMounted = true;

    const loadTranslations = async () => {
      try {
        const response = await fetch(`/api/translations/${currentLang}`, {
          cache: "no-store",
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && isMounted) {
            setTranslations((prev) => ({
              ...prev,
              [currentLang]: result.data,
            }));
          }
        }
      } catch (error) {
        console.warn("Failed to load translations from API, using fallback:", error);
        // Use fallback translations if API fails
        if (isMounted) {
          setTranslations((prev) => ({
            ...prev,
            [currentLang]: fallbackTranslations[currentLang],
          }));
        }
      } finally {
        if (isMounted) {
          setTranslationsLoaded(true);
        }
      }
    };

    // Always load translations for current language
    loadTranslations();

    // Listen for language changes
    const handleLanguageChange = () => {
      loadTranslations();
    };

    // Listen for translation updates (when translations are saved)
    const handleTranslationUpdate = () => {
      loadTranslations();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("languageChanged", handleLanguageChange);
      window.addEventListener("translationsUpdated", handleTranslationUpdate);
    }

    return () => {
      isMounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("languageChanged", handleLanguageChange);
        window.removeEventListener("translationsUpdated", handleTranslationUpdate);
      }
    };
  }, [currentLang]);

  // Helper function to get translation value
  const t = useCallback(
    (key: string, fallback?: string): string => {
      const keys = key.split(".");
      let value = translations[currentLang] || fallbackTranslations[currentLang];

      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = value[k];
        } else {
          // Fallback to English if translation not found
          value = translations["en"] || fallbackTranslations["en"];
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
    },
    [currentLang, translations]
  );

  return {
    t,
    translationsLoaded,
  };
}
