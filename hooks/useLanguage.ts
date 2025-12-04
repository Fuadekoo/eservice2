"use client";

import { useParams } from "next/navigation";

export type Language = "am" | "en" | "or";

export default function useLanguage() {
  const { lang } = useParams<{ lang: string }>();
  const currentLang = (lang as Language) || "en";

  const isAm = currentLang === "am";
  const isEn = currentLang === "en";
  const isOr = currentLang === "or";

  const getNextLanguage = (): Language => {
    switch (currentLang) {
      case "am":
        return "en";
      case "en":
        return "or";
      case "or":
        return "am";
      default:
        return "en";
    }
  };

  const getLanguageName = (lang: Language): string => {
    switch (lang) {
      case "am":
        return "አማርኛ";
      case "en":
        return "English";
      case "or":
        return "Afaan Oromoo";
      default:
        return "English";
    }
  };

  const getLanguageCode = (lang: Language): string => {
    switch (lang) {
      case "am":
        return "አ";
      case "en":
        return "E";
      case "or":
        return "ኦ";
      default:
        return "E";
    }
  };

  return {
    currentLang,
    isAm,
    isEn,
    isOr,
    getNextLanguage,
    getLanguageName,
    getLanguageCode,
  };
}
