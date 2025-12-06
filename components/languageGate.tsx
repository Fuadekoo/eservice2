"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const languages = [
  {
    code: "or",
    name: "Afaan Oromo",
    nativeName: "Afaan Oromoo",
  },
  {
    code: "am",
    name: "Amharic",
    nativeName: "አማርኛ",
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
  },
];

export function LanguageGate() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Check if user has already selected a language
    try {
      const stored = localStorage.getItem("eservice-language");
      if (!stored || !languages.some((lang) => lang.code === stored)) {
        // No language selected, show the gate
        setIsOpen(true);
      } else {
        // Language already selected, don't show the gate
        setIsOpen(false);
      }
    } catch {
      // If localStorage is not available, show the gate
      setIsOpen(true);
    }
  }, []);

  const handleLanguageSelect = (langCode: string) => {
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
    setIsOpen(false);
    // Refresh the page to apply the language change
    window.location.reload();
  };

  if (!isMounted) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Globe className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Choose a language?
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-6">
          {languages.map((language) => (
            <Button
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              className="w-full justify-start h-auto py-4 px-4 text-left hover:bg-accent"
              variant="outline"
            >
              <div className="flex flex-col items-start">
                <span className="font-semibold text-base">
                  {language.nativeName}
                </span>
                <span className="text-sm text-muted-foreground">
                  {language.name}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
