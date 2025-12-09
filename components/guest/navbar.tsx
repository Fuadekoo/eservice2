"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, Globe, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useLanguageStore } from "@/store/language-store";
import type { Language } from "@/lib/utils/cookies";
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

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage } = useLanguageStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLanguageChange = (langCode: Language) => {
    setLanguage(langCode);
    // Update URL to reflect language change
    const currentPath = pathname?.replace(/^\/(en|am|or)/, "") || "";
    const newPath = currentPath === "" || currentPath === "/" 
      ? `/${langCode}` 
      : `/${langCode}${currentPath}`;
    router.replace(newPath);
  };

  const currentLanguage =
    languages.find((lang) => lang.code === language) || languages[0];

  return (
    <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-90 transition"
          >
            <div className="relative w-8 h-8 bg-primary-foreground rounded-lg flex items-center justify-center overflow-hidden">
              <Image
                src="/oromia.png"
                alt="East Shoa Government"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-xl font-bold hidden sm:block">
              East Shoa Government
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="hover:opacity-90 transition">
              Home
            </Link>
            <Link href="/services" className="hover:opacity-90 transition">
              Services
            </Link>

            {/* Language Toggle */}
            {isMounted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 hover:opacity-90 hover:bg-primary-foreground/10 text-primary-foreground"
                  >
                    <Globe size={18} />
                    <span className="uppercase font-semibold">
                      {currentLanguage.nativeName}
                    </span>
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
            )}

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-2 hover:bg-primary-foreground/10 rounded-lg transition"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Sign In Button */}
            <Link href={`/${language}/login`}>
              <Button variant="secondary" size="sm">
                Sign In
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-2 hover:bg-primary-foreground/10 rounded-lg transition"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {isMounted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-primary-foreground/10 text-primary-foreground"
                  >
                    <Globe size={18} />
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
            )}

            <button
              className="p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-3">
            <Link
              href="/"
              className="hover:opacity-90 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/services"
              className="hover:opacity-90 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Services
            </Link>
            <Link
              href={`/${language}/login`}
              className="w-full"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Button variant="secondary" size="sm" className="w-full">
                Sign In
              </Button>
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
