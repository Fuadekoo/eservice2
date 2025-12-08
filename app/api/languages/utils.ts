import { promises as fs } from "fs";
import path from "path";
import { TranslationKey } from "@/app/[lang]/dashboard/@admin/languages/_store/language-store";

const LOCALES_DIR = path.join(process.cwd(), "localization", "locales");

/**
 * Flatten a nested object to dot-notation keys
 * Example: { common: { loading: "..." } } => { "common.loading": "..." }
 */
export function flattenObject(obj: any, prefix = ""): Record<string, string> {
  const flattened: Record<string, string> = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        // Recursively flatten nested objects
        Object.assign(flattened, flattenObject(value, newKey));
      } else if (typeof value === "string") {
        // Only include string values
        flattened[newKey] = value;
      }
    }
  }

  return flattened;
}

/**
 * Unflatten dot-notation keys to nested object
 * Example: { "common.loading": "..." } => { common: { loading: "..." } }
 */
export function unflattenObject(flat: Record<string, string>): any {
  const result: any = {};

  for (const key in flat) {
    if (flat.hasOwnProperty(key)) {
      const keys = key.split(".");
      let current = result;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!(k in current)) {
          current[k] = {};
        }
        current = current[k];
      }

      current[keys[keys.length - 1]] = flat[key];
    }
  }

  return result;
}

/**
 * Read all translation files and convert to TranslationKey format
 */
export async function loadAllTranslations(): Promise<TranslationKey[]> {
  try {
    // Get all JSON files in locales directory
    const files = await fs.readdir(LOCALES_DIR);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    if (jsonFiles.length === 0) {
      return [];
    }

    // Read all language files
    const translationsByLang: Record<string, Record<string, string>> = {};

    for (const file of jsonFiles) {
      const langCode = file.replace(".json", "");
      const filePath = path.join(LOCALES_DIR, file);
      const content = await fs.readFile(filePath, "utf-8");
      const json = JSON.parse(content);
      translationsByLang[langCode] = flattenObject(json);
    }

    // Get all unique keys across all languages
    const allKeys = new Set<string>();
    for (const lang in translationsByLang) {
      Object.keys(translationsByLang[lang]).forEach((key) => allKeys.add(key));
    }

    // Convert to TranslationKey format
    const translationKeys: TranslationKey[] = Array.from(allKeys).map((key) => {
      const translations: Record<string, string> = {};
      for (const lang in translationsByLang) {
        if (translationsByLang[lang][key]) {
          translations[lang] = translationsByLang[lang][key];
        }
      }
      return {
        key,
        translations,
      };
    });

    return translationKeys;
  } catch (error) {
    console.error("Error loading translations:", error);
    return [];
  }
}

/**
 * Save translations back to JSON files
 */
export async function saveTranslations(
  translationKeys: TranslationKey[]
): Promise<void> {
  try {
    // Group translations by language
    const translationsByLang: Record<string, Record<string, string>> = {};

    for (const tk of translationKeys) {
      for (const lang in tk.translations) {
        if (!translationsByLang[lang]) {
          translationsByLang[lang] = {};
        }
        translationsByLang[lang][tk.key] = tk.translations[lang];
      }
    }

    // Write each language file
    for (const lang in translationsByLang) {
      const unflattened = unflattenObject(translationsByLang[lang]);
      const filePath = path.join(LOCALES_DIR, `${lang}.json`);
      await fs.writeFile(
        filePath,
        JSON.stringify(unflattened, null, 2),
        "utf-8"
      );
    }
  } catch (error) {
    console.error("Error saving translations:", error);
    throw error;
  }
}

/**
 * Update a single translation value
 */
export async function updateTranslation(
  langCode: string,
  key: string,
  value: string
): Promise<void> {
  try {
    const filePath = path.join(LOCALES_DIR, `${langCode}.json`);

    // Read existing file
    let json: any = {};
    try {
      const content = await fs.readFile(filePath, "utf-8");
      json = JSON.parse(content);
    } catch {
      // File doesn't exist, create new
      json = {};
    }

    // Update the nested structure
    const keys = key.split(".");
    let current = json;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== "object") {
        current[k] = {};
      }
      current = current[k];
    }

    current[keys[keys.length - 1]] = value;

    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(json, null, 2), "utf-8");
  } catch (error) {
    console.error("Error updating translation:", error);
    throw error;
  }
}

/**
 * Add a new translation key
 */
export async function addTranslationKey(
  key: string,
  translations: Record<string, string>
): Promise<void> {
  try {
    // Update each language file
    for (const lang in translations) {
      const filePath = path.join(LOCALES_DIR, `${lang}.json`);

      // Read existing file
      let json: any = {};
      try {
        const content = await fs.readFile(filePath, "utf-8");
        json = JSON.parse(content);
      } catch {
        // File doesn't exist, create new
        json = {};
      }

      // Add the new key
      const keys = key.split(".");
      let current = json;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!(k in current) || typeof current[k] !== "object") {
          current[k] = {};
        }
        current = current[k];
      }

      current[keys[keys.length - 1]] = translations[lang] || "";

      // Write back to file
      await fs.writeFile(filePath, JSON.stringify(json, null, 2), "utf-8");
    }
  } catch (error) {
    console.error("Error adding translation key:", error);
    throw error;
  }
}

/**
 * Delete a translation key from all language files
 */
export async function deleteTranslationKey(key: string): Promise<void> {
  try {
    // Get all JSON files
    const files = await fs.readdir(LOCALES_DIR);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    // Delete the key from each file
    for (const file of jsonFiles) {
      const filePath = path.join(LOCALES_DIR, file);

      try {
        const content = await fs.readFile(filePath, "utf-8");
        const json = JSON.parse(content);

        // Delete the nested key
        const keys = key.split(".");
        let current = json;

        for (let i = 0; i < keys.length - 1; i++) {
          if (!(keys[i] in current)) {
            break; // Key path doesn't exist
          }
          current = current[keys[i]];
        }

        if (current && typeof current === "object") {
          delete current[keys[keys.length - 1]];

          // Clean up empty parent objects
          if (Object.keys(current).length === 0 && keys.length > 1) {
            let parent = json;
            for (let i = 0; i < keys.length - 2; i++) {
              parent = parent[keys[i]];
            }
            delete parent[keys[keys.length - 2]];
          }

          // Write back to file
          await fs.writeFile(filePath, JSON.stringify(json, null, 2), "utf-8");
        }
      } catch (error) {
        console.error(`Error deleting key from ${file}:`, error);
        // Continue with other files
      }
    }
  } catch (error) {
    console.error("Error deleting translation key:", error);
    throw error;
  }
}

