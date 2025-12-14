"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function Logo() {
  const { lang } = useParams<{ lang: string }>();

  return (
    <div className="shrink-0 px-3 py-2.5 flex gap-2 items-center">
      <Link href={"/"} className="shrink-0">
        <Image
          alt=""
          src={"/logo.png"}
          width={100}
          height={100}
          className="size-8"
        />
      </Link>
      <Link
        href={"/"}
        className="text-lg tracking-wide font-bold text-black dark:text-white truncate"
      >
        {lang == "am" ? "E-service" : "East shoa E-service"}
      </Link>
    </div>
  );
}
