"use client";

import Logo from "./logo";
import Profile from "./profile";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { X } from "lucide-react";
import React from "react";
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
  const { t } = useTranslation();

  return (
    <nav
      className={
        "z-50 lg:grid overflow-hidden max-lg:absolute max-lg:inset-0 max-lg:peer-checked/sidebar:grid max-lg:grid-cols-[auto_1fr] hidden "
      }
    >
      <div className="overflow-hidden max-lg:w-64 lg:w-80 bg-background/50 backdrop-blur-3xl grid grid-rows-[auto_1fr_auto] min-h-screen">
        <div className="relative">
          <Logo />
          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 lg:hidden"
            asChild
          >
            <label htmlFor="sidebar">
              <X className="h-4 w-4" />
            </label>
          </Button>
        </div>
        <ScrollArea className="flex-1 p-4 pb-4">
          <div className="flex flex-col">
            {menu.map((item, i) => (
              <React.Fragment key={i + ""}>
                {i !== 0 && <hr className="border-primary" />}
                <div key={i + ""} className="py-3 flex flex-col gap-2">
                  {item.map(({ key, url, Icon }, i) => (
                    <Button
                      key={i + ""}
                      size="lg"
                      variant={selected == url ? "default" : "ghost"}
                      className="shrink-0 justify-start capitalize text-sm lg:text-base"
                      asChild
                    >
                      <Link href={`/${lang}/dashboard/${url}`}>
                        {Icon}
                        {t(`navigation.${key}`)}
                      </Link>
                    </Button>
                  ))}
                </div>
              </React.Fragment>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-primary/20 bg-background/30">
          <Profile />
        </div>
      </div>
      <label
        htmlFor="sidebar"
        className="lg:hidden bg-foreground/50 backdrop-blur-sm "
      />
    </nav>
  );
}
