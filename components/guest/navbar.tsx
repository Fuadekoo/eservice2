"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, Globe, Moon, Sun, ChevronDown } from "lucide-react";
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/user/me");
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const handleLanguageChange = (langCode: Language) => {
    setLanguage(langCode);
    // Update URL to reflect language change
    const currentPath = pathname?.replace(/^\/(en|am|or)/, "") || "";
    const newPath =
      currentPath === "" || currentPath === "/"
        ? `/${langCode}`
        : `/${langCode}${currentPath}`;
    router.replace(newPath);
  };

  const currentLanguage =
    languages.find((lang) => lang.code === language) || languages[0];

  return (
    <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-90 transition"
          >
            <div className="relative w-8 h-8 bg-primary rounded-lg flex items-center justify-center overflow-hidden">
              <Image
                src="/oromia.png"
                alt="East Shoa Government"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-xl font-bold hidden sm:block text-foreground">
              East Shoa Government
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            {/* Language Toggle */}
            {isMounted && (
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
                      className={language === lang.code ? "bg-accent" : ""}
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
            )}

            {/* Theme Toggle */}
            {isMounted && (
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="w-10 h-10 rounded-full border border-gray-300 bg-background hover:bg-gray-50 flex items-center justify-center transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "light" ? (
                  <Moon size={18} className="text-foreground" />
                ) : (
                  <Sun size={18} className="text-foreground" />
                )}
              </button>
            )}

            {/* Sign In / Dashboard Button */}
            {!isCheckingAuth && (
              <Link href={isAuthenticated ? `/${language}/dashboard` : `/${language}/login`}>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md px-4 py-2"
                >
                  {isAuthenticated ? "Dashboard" : "Sign In"}
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-2">
            {isMounted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 bg-background border-gray-300 hover:bg-gray-50 text-foreground font-semibold rounded-md px-2 py-2"
                  >
                    <span className="font-bold text-sm">{currentLanguage.name}</span>
                    <ChevronDown size={14} className="text-muted-foreground" />
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
                        <span className="font-medium">{lang.name}</span>
                        <span className="text-muted-foreground text-xs ml-auto">
                          ({lang.name})
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {isMounted && (
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="w-9 h-9 rounded-full border border-gray-300 bg-background hover:bg-gray-50 flex items-center justify-center transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "light" ? (
                  <Moon size={16} className="text-foreground" />
                ) : (
                  <Sun size={16} className="text-foreground" />
                )}
              </button>
            )}

            {/* Login / Dashboard Button */}
            {!isCheckingAuth && (
              <Link href={isAuthenticated ? `/${language}/dashboard` : `/${language}/login`}>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md px-3 py-2"
                >
                  {isAuthenticated ? "Dashboard" : "Sign In"}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
