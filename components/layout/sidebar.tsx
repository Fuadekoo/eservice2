"use client";

import Logo from "./logo";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import useTranslation from "@/hooks/useTranslation";

export default function SideBar({
  menu,
}: {
  menu: {
    key: string;
    url: string;
    Icon: React.JSX.Element;
  }[][];
}) {
  const selected = usePathname().split("/")[3] ?? "";
  const { lang } = useParams<{ lang: string }>();
  const { t, translationsLoaded } = useTranslation();
  const [forceUpdate, setForceUpdate] = useState(0);

  // Listen for language changes to force re-render
  useEffect(() => {
    const handleLanguageChange = () => {
      setForceUpdate((prev) => prev + 1);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("languageChanged", handleLanguageChange);
      return () => {
        window.removeEventListener("languageChanged", handleLanguageChange);
      };
    }
  }, []);

  return (
    <nav
      className={
        "z-[60] lg:z-50 overflow-hidden max-lg:absolute max-lg:inset-0 max-lg:peer-checked/sidebar:grid max-lg:grid-cols-[auto_1fr] hidden lg:peer-checked/sidebar:grid "
      }
    >
      <div className="overflow-hidden max-lg:w-64 lg:w-56 bg-blue-500 dark:bg-blue-700 grid grid-rows-[auto_1fr_auto] min-h-screen">
        <div className="relative border-b border-blue-400/30 dark:border-blue-600/30">
          <Logo />
          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 lg:hidden text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
            asChild
          >
            <label htmlFor="sidebar">
              <X className="h-4 w-4" />
            </label>
          </Button>
        </div>
        <ScrollArea className="flex-1 p-3 pb-3">
          <div className="flex flex-col">
            {menu.map((item, i) => (
              <React.Fragment key={i + ""}>
                {i !== 0 && (
                  <hr className="border-sky-400/30 dark:border-sky-600/30 my-1" />
                )}
                <div key={i + ""} className="py-2 flex flex-col gap-1.5">
                  {item.map(({ key, url, Icon }, i) => {
                    const href = url
                      ? `/${lang}/dashboard/${url}`
                      : `/${lang}/dashboard`;
                    const isSelected =
                      url === "" ? selected === "" : selected === url;
                    return (
                      <Button
                        key={i + ""}
                        size="lg"
                        variant="ghost"
                        className={`shrink-0 justify-start capitalize text-sm px-3 h-10 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 ${
                          isSelected ? "bg-black/20 dark:bg-white/20" : ""
                        }`}
                        asChild
                      >
                        <Link href={href}>
                          <span className="text-black dark:text-white">
                            {Icon}
                          </span>
                          <span className="truncate text-black dark:text-white">
                            {t(`navigation.${key}`)}
                          </span>
                        </Link>
                      </Button>
                    );
                  })}
                </div>
              </React.Fragment>
            ))}
          </div>
        </ScrollArea>
      </div>
      <label
        htmlFor="sidebar"
        className="lg:hidden bg-foreground/50 backdrop-blur-sm "
      />
    </nav>
  );
}
