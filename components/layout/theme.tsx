"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function Theme() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  if (!mounted) {
    return (
      <button
        className="w-10 h-10 rounded-full border border-gray-300 bg-background hover:bg-gray-50 flex items-center justify-center transition-colors"
        aria-label="Toggle theme"
      >
        <Sun size={18} className="text-foreground" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 rounded-full border border-gray-300 bg-background hover:bg-gray-50 flex items-center justify-center transition-colors"
      aria-label={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} mode`}
    >
      {resolvedTheme === "light" ? (
        <Moon size={18} className="text-foreground" />
      ) : (
        <Sun size={18} className="text-foreground" />
      )}
    </button>
  );
}
