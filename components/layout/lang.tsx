"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "../ui/button";
import useLanguage from "@/hooks/useLanguage";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Language } from "@/hooks/useLanguage";

const languages = [
  { code: "en" as Language, name: "English" },
  { code: "am" as Language, name: "Amharic" },
  { code: "or" as Language, name: "Oromo" },
];

export default function Lang() {
  const { currentLang } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  const handleLanguageChange = (langCode: Language) => {
    const url = pathname.split("/").slice(2).join("/");
    const newPath =
      url === "" || url === "/" ? `/${langCode}` : `/${langCode}/${url}`;
    router.replace(newPath);
  };

  const currentLanguage = languages.find((lang) => lang.code === currentLang) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-background border-gray-300 hover:bg-gray-50 text-foreground font-semibold rounded-md px-3 py-2"
        >
          <span className="font-bold">{currentLanguage.name}</span>
          <span className="text-muted-foreground text-sm font-normal">
            ({currentLanguage.name})
          </span>
          <ChevronDown size={16} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={currentLang === lang.code ? "bg-accent" : ""}
          >
            <div className="flex items-center gap-2 w-full">
              <span className="font-medium">{lang.name}</span>
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
