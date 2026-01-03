"use client";

import { AlignLeft, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { useEffect, useMemo, useState } from "react";
import Lang from "./lang";
import Theme from "./theme";
import UserMenu from "./user-menu";

type UserMeResponse = {
  success?: boolean;
  data?: {
    username?: string | null;
  };
};

export default function Header() {
  const [displayName, setDisplayName] = useState<string>("User");

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/user/me");
        const json = (await res.json()) as UserMeResponse;
        const name = json?.data?.username || "User";
        setDisplayName(name);
      } catch {
        // Keep default
      }
    };

    fetchMe();
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-50 h-16 lg:h-20 bg-background border-b shadow-sm">
      <div className="h-full px-3 sm:px-4 lg:px-6 xl:px-10 flex items-center gap-2 sm:gap-3">
        {/* Sidebar toggle button - visible on all screen sizes */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-9 w-9"
          asChild
        >
          <label htmlFor="sidebar" className="cursor-pointer">
            <AlignLeft className="h-5 w-5" />
          </label>
        </Button>

        {/* Greeting */}
        <div className="min-w-0">
          <h2 className="truncate text-base sm:text-lg lg:text-2xl font-bold leading-tight">
            {greeting}, {displayName}!
          </h2>
        </div>

        {/* Spacer */}
        <div className="flex-1 min-w-0"></div>

        {/* Right side actions */}
        <div className="flex items-center gap-4 shrink-0">
          <Lang />
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            className="h-9 w-9 sm:h-10 sm:w-10 bg-background border border-gray-300 hover:bg-gray-50"
            title="Refresh page"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Theme />
          {/* User menu - visible on all devices */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
