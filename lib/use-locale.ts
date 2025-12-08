"use client";

import { useEffect } from "react";
import { useLanguageStore } from "@/store/language-store";
import { useParams, useRouter, usePathname } from "next/navigation";
import type { Language } from "@/lib/utils/cookies";

export function useLocale() {
  const { language, setLanguage, initializeLanguage } = useLanguageStore();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Initialize language from cookie on mount
    initializeLanguage();
    
    // Sync with URL param if present
    const urlLang = params?.lang as string;
    if (urlLang && ["en", "am", "or"].includes(urlLang) && urlLang !== language) {
      setLanguage(urlLang as Language);
    } else if (!urlLang || !["en", "am", "or"].includes(urlLang)) {
      // If no valid lang in URL, redirect to current language
      const currentPath = pathname?.replace(/^\/(en|am|or)/, "") || "";
      router.replace(`/${language}${currentPath}`);
    }
  }, [params?.lang, language, setLanguage, initializeLanguage, router, pathname]);

  const setLocale = (newLocale: Language) => {
    setLanguage(newLocale);
    // Update URL to reflect language change
    const currentPath = pathname?.replace(/^\/(en|am|or)/, "") || "";
    router.replace(`/${newLocale}${currentPath}`);
  };

  return { locale: language, setLocale };
}
