"use client";

import { useTheme } from "next-themes";
import { Button } from "../ui/button";
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
      <div className="">
        <Button
          variant="outline"
          size="icon"
          className="border border-amber-700 bg-amber-500/10"
        >
          <Sun className="h-6 w-6 stroke-amber-700 fill-amber-700" />
        </Button>
      </div>
    );
  }

  return (
    <div className="">
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className="border border-amber-700 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
        title={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} mode`}
      >
        {resolvedTheme === "light" ? (
          <Moon className="h-6 w-6 stroke-amber-700 fill-amber-700 transition-transform hover:rotate-12" />
        ) : (
          <Sun className="h-6 w-6 stroke-amber-700 fill-amber-700 transition-transform hover:rotate-45" />
        )}
        <span className="sr-only">
          Toggle theme (currently {resolvedTheme})
        </span>
      </Button>
    </div>
  );
}
