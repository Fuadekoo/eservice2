"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, X, Globe, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const languages = [
    { code: "en", name: "English", nativeName: "EN" },
    { code: "am", name: "Amharic", nativeName: "አማ" },
    { code: "or", name: "Afan Oromo", nativeName: "OM" },
  ];

  const [currentLocale, setCurrentLocale] = useState("en");

  useEffect(() => {
    // Initialize locale from localStorage
    try {
      const stored = localStorage.getItem("eservice-language");
      if (stored && languages.some((l) => l.code === stored)) {
        setCurrentLocale(stored);
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleLocaleChange = (langCode: string) => {
    setCurrentLocale(langCode);
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
    setLangMenuOpen(false);
    router.refresh();
  };

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
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-2 hover:opacity-90 transition"
              >
                <Globe size={18} />
                <span className="uppercase font-semibold">{currentLocale}</span>
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white text-foreground rounded-lg shadow-lg py-2 z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLocaleChange(lang.code)}
                      className={`w-full text-left px-4 py-2 hover:bg-blue-100 transition ${
                        currentLocale === lang.code
                          ? "bg-blue-50 font-semibold"
                          : ""
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-2 hover:bg-primary-foreground/10 rounded-lg transition"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Sign In Button */}
            <Link href="/signin">
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

            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="p-2 hover:bg-primary-foreground/10 rounded-lg transition"
              >
                <Globe size={18} />
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white text-foreground rounded-lg shadow-lg py-2 z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLocaleChange(lang.code)}
                      className={`w-full text-left px-4 py-2 hover:bg-blue-100 transition ${
                        currentLocale === lang.code
                          ? "bg-blue-50 font-semibold"
                          : ""
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
              href="/signin"
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
