import { create } from "zustand";
import { persist } from "zustand/middleware";

// Type definitions (must be defined before API functions)
export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export interface TranslationKey {
  key: string;
  translations: Record<string, string>;
}

// API functions for dynamic language management
async function fetchLanguagesFromApi() {
  try {
    const res = await fetch("/api/languages", { cache: "no-store" });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to load languages: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to load languages");
    }
    return {
      availableLanguages: data.data?.availableLanguages || defaultLanguages,
      translations: data.data?.translations || initialTranslations,
    };
  } catch (error: any) {
    console.error("Error fetching languages:", error);
    // Return defaults on error instead of throwing
    return {
      availableLanguages: defaultLanguages,
      translations: initialTranslations,
    };
  }
}

async function saveLanguagesToApi(payload: {
  availableLanguages: Language[];
  translations: TranslationKey[];
}) {
  const res = await fetch("/api/languages", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save languages");
}

async function addLanguageToApi(language: Language) {
  const res = await fetch("/api/languages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language }),
  });
  if (!res.ok) throw new Error("Failed to add language");
}

async function deleteLanguageFromApi(langCode: string) {
  const res = await fetch(`/api/languages?code=${langCode}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete language");
}

// New API functions for managing translation keys
async function addTranslationKeyToApi(
  key: string,
  translations: Record<string, string>
) {
  const res = await fetch("/api/languages/keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, translations }),
  });
  if (!res.ok) throw new Error("Failed to add translation key");
}

async function updateTranslationKeyToApi(
  key: string,
  translations: Record<string, string>
) {
  const res = await fetch("/api/languages/keys", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, translations }),
  });
  if (!res.ok) throw new Error("Failed to update translation key");
}

async function deleteTranslationKeyFromApi(key: string) {
  const res = await fetch(
    `/api/languages/keys?key=${encodeURIComponent(key)}`,
    {
      method: "DELETE",
    }
  );
  if (!res.ok) throw new Error("Failed to delete translation key");
}

async function updateSingleTranslationApi(
  langCode: string,
  key: string,
  value: string
) {
  const res = await fetch(
    `/api/languages/${langCode}/${encodeURIComponent(key)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    }
  );
  if (!res.ok) throw new Error("Failed to update translation");
}

// Load translations from JSON files (fallback)
async function loadTranslationsFromJSON(langCode: string) {
  try {
    const res = await fetch(`/locales/${langCode}.json`, { cache: "no-store" });
    if (!res.ok) {
      // File doesn't exist or failed to load - return empty object instead of throwing
      console.warn(
        `Translation file for ${langCode} not found or failed to load. Using empty translations.`
      );
      return {};
    }
    return await res.json();
  } catch (error) {
    // Don't throw error, just return empty object and log warning
    console.warn(`Error loading ${langCode} translations:`, error);
    return {};
  }
}

// Default languages
const defaultLanguages: Language[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "am", name: "Amharic", nativeName: "አማርኛ" },
  { code: "or", name: "Oromo", nativeName: "Afaan Oromoo" },
];

const initialTranslations: TranslationKey[] = [
  {
    key: "dashboard",
    translations: {
      en: "Dashboard",
      am: "ዳሽቦርድ",
      or: "Gabatee",
    },
  },
  {
    key: "user_authentication_failed",
    translations: {
      en: "User Authentication Failed",
      am: "የተጠቃሚ ማረጋገጫ አልተሳካም",
      or: "Mirkaneessuu fayyadamaa kufaa",
    },
  },
  {
    key: "The email or phone field is required",
    translations: {
      en: "The Email or Phone Field is Required",
      am: "የኢሜል ወይም ስልክ ቁጥር መስክ ያስፈልጋል",
      or: "Diriin imeelii ykn bilbilaa barbaachisaa",
    },
  },
  {
    key: "The password field is required",
    translations: {
      en: "The Password Field is Required",
      am: "የይለፍ ቃል መስክ ያስፈልጋል",
      or: "Diriin jecha dabaraa barbaachisaa",
    },
  },
];

// Zustand Store with dynamic language management
export interface LanguagesStore {
  // State
  availableLanguages: Language[];
  selectedLanguage: string;
  translations: TranslationKey[];
  isAddKeyDialogOpen: boolean;
  isEditKeyDialogOpen: boolean;
  selectedTranslationKey: TranslationKey | null;
  newKeyForm: {
    key: string;
    translations: Record<string, string>;
  };
  searchTerm: string;
  filteredTranslations: TranslationKey[];
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  translationData: Record<string, any>; // Loaded JSON data for current language

  // Actions
  setSelectedLanguage: (languageCode: string) => void;
  setSearchTerm: (term: string) => void;
  setIsAddKeyDialogOpen: (isOpen: boolean) => void;
  setIsEditKeyDialogOpen: (isOpen: boolean) => void;
  setSelectedTranslationKey: (key: TranslationKey | null) => void;
  updateTranslation: (key: string, languageCode: string, value: string) => void;
  addNewTranslationKey: (
    key: string,
    translations: Record<string, string>
  ) => void;
  deleteTranslationKey: (key: string) => void;
  updateNewKeyForm: (
    field: string,
    value: string | Record<string, string>
  ) => void;
  resetNewKeyForm: () => void;
  saveTranslations: () => Promise<void>;
  loadTranslations: () => Promise<void>;
  filterTranslations: () => void;
  getTranslationForKey: (key: string, languageCode?: string) => string;
  addLanguage: (language: Language) => Promise<void>;
  deleteLanguage: (langCode: string) => Promise<void>;
  loadTranslationData: (langCode: string) => Promise<void>;
  t: (key: string, defaultValue?: string) => string;
}

export const useLanguagesStore = create<LanguagesStore>()(
  persist(
    (set, get) => ({
      // Initial State
      availableLanguages: defaultLanguages,
      selectedLanguage: "en",
      translations: initialTranslations,
      isAddKeyDialogOpen: false,
      isEditKeyDialogOpen: false,
      selectedTranslationKey: null,
      newKeyForm: {
        key: "",
        translations: {},
      },
      searchTerm: "",
      filteredTranslations: initialTranslations,
      hasUnsavedChanges: false,
      isLoading: false,
      translationData: {},

      // Actions
      setSelectedLanguage: async (languageCode) => {
        set({ selectedLanguage: languageCode });

        // Load translation data for the new language
        await get().loadTranslationData(languageCode);

        // Trigger event for components to re-render
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("languageChanged", { detail: languageCode })
          );
        }
      },

      setSearchTerm: (term) => {
        set({ searchTerm: term });
        get().filterTranslations();
      },

      setIsAddKeyDialogOpen: (isOpen) => {
        set({ isAddKeyDialogOpen: isOpen });
        if (!isOpen) {
          get().resetNewKeyForm();
        }
      },

      setIsEditKeyDialogOpen: (isOpen) => {
        set({ isEditKeyDialogOpen: isOpen });
        if (!isOpen) {
          set({ selectedTranslationKey: null });
        }
      },

      setSelectedTranslationKey: (key) => {
        set({ selectedTranslationKey: key });
      },

      updateTranslation: async (key, languageCode, value) => {
        try {
          set({ isLoading: true });
          await updateSingleTranslationApi(languageCode, key, value);

          const { translations } = get();
          const updatedTranslations = translations.map((translation) => {
            if (translation.key === key) {
              return {
                ...translation,
                translations: {
                  ...translation.translations,
                  [languageCode]: value,
                },
              };
            }
            return translation;
          });

          set({
            translations: updatedTranslations,
            hasUnsavedChanges: false,
          });
          get().filterTranslations();
        } catch (e) {
          console.error("Failed to update translation:", e);
          throw e;
        } finally {
          set({ isLoading: false });
        }
      },

      addNewTranslationKey: async (key, translationsObj) => {
        try {
          set({ isLoading: true });
          await addTranslationKeyToApi(key, translationsObj);

          const { translations } = get();
          const newTranslation: TranslationKey = {
            key,
            translations: translationsObj,
          };

          set({
            translations: [...translations, newTranslation],
            hasUnsavedChanges: false,
            isAddKeyDialogOpen: false,
          });
          get().resetNewKeyForm();
          get().filterTranslations();
        } catch (e) {
          console.error("Failed to add translation key:", e);
          throw e;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteTranslationKey: async (key) => {
        try {
          set({ isLoading: true });
          await deleteTranslationKeyFromApi(key);

          const { translations } = get();
          const updatedTranslations = translations.filter(
            (translation) => translation.key !== key
          );

          set({
            translations: updatedTranslations,
            hasUnsavedChanges: false,
          });
          get().filterTranslations();
        } catch (e) {
          console.error("Failed to delete translation key:", e);
          throw e;
        } finally {
          set({ isLoading: false });
        }
      },

      updateNewKeyForm: (field, value) => {
        const { newKeyForm } = get();
        set({
          newKeyForm: {
            ...newKeyForm,
            [field]: value,
          },
        });
      },

      resetNewKeyForm: () => {
        set({
          newKeyForm: {
            key: "",
            translations: {},
          },
        });
      },

      saveTranslations: async () => {
        const { availableLanguages, translations } = get();
        try {
          set({ isLoading: true });
          await saveLanguagesToApi({ availableLanguages, translations });
          set({ hasUnsavedChanges: false });
        } catch (e) {
          console.error("Failed to save translations:", e);
          // Keep unsaved flag if it fails
        } finally {
          set({ isLoading: false });
        }
      },

      loadTranslations: async () => {
        try {
          set({ isLoading: true });
          const data = await fetchLanguagesFromApi();
          set({
            availableLanguages: data.availableLanguages || defaultLanguages,
            translations: data.translations || initialTranslations,
            filteredTranslations: data.translations || initialTranslations,
          });
        } catch (e) {
          console.error("Failed to load translations:", e);
          // Fallback to defaults if fetch fails
          set({
            availableLanguages: defaultLanguages,
            translations: initialTranslations,
            filteredTranslations: initialTranslations,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      filterTranslations: () => {
        const { translations, searchTerm } = get();
        if (!searchTerm) {
          set({ filteredTranslations: translations });
          return;
        }

        const filtered = translations.filter(
          (translation) =>
            translation.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
            Object.values(translation.translations).some((value) =>
              value.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );

        set({ filteredTranslations: filtered });
      },

      getTranslationForKey: (key, languageCode) => {
        const { translations, selectedLanguage } = get();
        const lang = languageCode || selectedLanguage;
        const translation = translations.find((t) => t.key === key);
        return translation?.translations[lang] || key;
      },

      addLanguage: async (language) => {
        try {
          set({ isLoading: true });
          await addLanguageToApi(language);
          const { availableLanguages } = get();
          set({
            availableLanguages: [...availableLanguages, language],
            hasUnsavedChanges: true,
          });
        } catch (e) {
          console.error("Failed to add language:", e);
          throw e;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteLanguage: async (langCode) => {
        try {
          set({ isLoading: true });
          await deleteLanguageFromApi(langCode);
          const { availableLanguages, translations } = get();

          // Remove language from available languages
          const updatedLanguages = availableLanguages.filter(
            (lang) => lang.code !== langCode
          );

          // Remove language from all translations
          const updatedTranslations = translations.map((translation) => ({
            ...translation,
            translations: Object.fromEntries(
              Object.entries(translation.translations).filter(
                ([code]) => code !== langCode
              )
            ),
          }));

          set({
            availableLanguages: updatedLanguages,
            translations: updatedTranslations,
            hasUnsavedChanges: true,
          });
          get().filterTranslations();
        } catch (e) {
          console.error("Failed to delete language:", e);
          throw e;
        } finally {
          set({ isLoading: false });
        }
      },

      loadTranslationData: async (langCode) => {
        // Always set empty object first to avoid errors
        set({ translationData: {} });

        try {
          const data = await loadTranslationsFromJSON(langCode);
          if (data && Object.keys(data).length > 0) {
            set({ translationData: data });
          }
        } catch (error) {
          // Silently fail - translations will fallback to keys or default values
          // Don't log errors for missing translation files
        }
      },

      t: (key, defaultValue) => {
        const { translationData } = get();
        const keys = key.split(".");
        let value: any = translationData;

        for (const k of keys) {
          if (value && typeof value === "object" && k in value) {
            value = value[k];
          } else {
            return defaultValue || key;
          }
        }

        return typeof value === "string" ? value : defaultValue || key;
      },
    }),
    {
      name: "language-storage",
      partialize: (state) => ({ selectedLanguage: state.selectedLanguage }),
    }
  )
);
