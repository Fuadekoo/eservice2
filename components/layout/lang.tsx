"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import useLanguage from "@/hooks/useLanguage";
import { usePathname } from "next/navigation";

export default function Lang() {
  const { currentLang, getNextLanguage, getLanguageName, getLanguageCode } =
    useLanguage();
  const pathname = usePathname();
  const url = pathname.split("/").slice(2).join("/");
  const nextLang = getNextLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-fit px-2 md:px-5 bg-background/50 gap-0 text-lg border border-primary/20 hover:bg-primary/10"
      asChild
    >
      <Link href={`/${nextLang}/${url}`}>
        <span className="font-semibold">{getLanguageCode(nextLang)}</span>
        <span className="max-md:hidden ml-1">
          {getLanguageName(nextLang).split(" ")[0]}
        </span>
      </Link>
    </Button>
  );
}
