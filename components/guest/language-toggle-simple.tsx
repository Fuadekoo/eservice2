"use client";

import * as React from "react";
import { Globe } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useLanguageStore } from "@/store/language-store";
import type { Language } from "@/lib/utils/cookies";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages = [
  { code: "en" as Language, name: "English", nativeName: "EN" },
  { code: "am" as Language, name: "Amharic", nativeName: "አማ" },
  { code: "or" as Language, name: "Oromo", nativeName: "OM" },
];

export function LanguageToggleSimple() {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage } = useLanguageStore();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLanguageChange = (langCode: Language) => {
    setLanguage(langCode);
    // Update URL to reflect language change
    const currentPath = pathname?.replace(/^\/(en|am|or)/, "") || "";
    router.replace(`/${langCode}${currentPath}`);
  };

  const currentLanguage =
    languages.find((lang) => lang.code === language) || languages[0];

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
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={language === lang.code ? "bg-accent" : ""}
          >
            <div className="flex items-center gap-2 w-full">
              <span className="font-medium">{lang.nativeName}</span>
              <span className="text-muted-foreground text-xs ml-auto">
                ({lang.name})
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
