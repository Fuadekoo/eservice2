"use client";

import * as React from "react";
import { Globe } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages = [
  { code: "en", name: "English", nativeName: "EN" },
  { code: "am", name: "Amharic", nativeName: "አማ" },
  { code: "or", name: "Oromo", nativeName: "OM" },
];

export function LanguageToggleSimple() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = React.useState(false);
  const [currentLang, setCurrentLang] = React.useState("en");

  React.useEffect(() => {
    setIsMounted(true);
    // Get current language from localStorage or default to 'en'
    try {
      const stored = localStorage.getItem("eservice-language");
      if (stored && languages.some((l) => l.code === stored)) {
        setCurrentLang(stored);
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleLanguageChange = (langCode: string) => {
    setCurrentLang(langCode);
    try {
      localStorage.setItem("eservice-language", langCode);
      if (typeof window !== "undefined") {
        (window as any).__ESERVICE_LANGUAGE__ = langCode;
        window.dispatchEvent(
          new CustomEvent("languageChanged", { detail: langCode })
        );
      }
    } catch {
      // Ignore
    }
    router.refresh();
  };

  const currentLanguage =
    languages.find((lang) => lang.code === currentLang) || languages[0];

  if (!isMounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full"
        aria-label="Toggle language"
      >
        <Globe className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          aria-label="Toggle language"
        >
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={currentLang === language.code ? "bg-accent" : ""}
          >
            <div className="flex items-center gap-2 w-full">
              <span className="font-medium">{language.nativeName}</span>
              <span className="text-muted-foreground text-xs ml-auto">
                ({language.name})
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
