"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getLanguageFromCookie, setLanguageCookie, type Language } from "@/lib/utils/cookies";

interface LanguageStore {
  language: Language;
  setLanguage: (language: Language) => void;
  initializeLanguage: () => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: "en",
      
      setLanguage: (language: Language) => {
        set({ language });
        setLanguageCookie(language);
        
        // Dispatch event for components to react to language changes
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("languageChanged", { detail: language })
          );
        }
      },
      
      initializeLanguage: () => {
        const cookieLanguage = getLanguageFromCookie();
        if (cookieLanguage !== get().language) {
          set({ language: cookieLanguage });
        }
      },
    }),
    {
      name: "eservice-language-storage",
      // Only persist to localStorage as backup, primary storage is cookies
      partialize: (state) => ({ language: state.language }),
    }
  )
);

// Initialize language from cookie on store creation
if (typeof window !== "undefined") {
  const cookieLanguage = getLanguageFromCookie();
  useLanguageStore.setState({ language: cookieLanguage });
}

