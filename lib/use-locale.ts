"use client";

import { useState, useEffect } from "react";

export function useLocale() {
  const [locale, setLocale] = useState<"en" | "am" | "or">("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("eservice-language");
      if (stored === "en" || stored === "am" || stored === "or") {
        setLocale(stored);
      }
    } catch {
      // Ignore
    }
  }, []);

  return { locale, setLocale };
}
