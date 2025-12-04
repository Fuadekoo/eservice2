"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function Logo() {
  const { lang } = useParams<{ lang: string }>();

  return (
    <div className="shrink-0 px-5 py-3 flex gap-2 items-center  ">
      <Link href={"/"} className=" ">
        <Image
          alt=""
          src={"/logo.png"}
          width={100}
          height={100}
          className="size-10 "
        />
      </Link>
      <Link
        href={"/"}
        className=" text-2xl tracking-wider font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
      >
        {lang == "am"
          ? "ኦሮሚያ ክልል ምስራቅ ሸዋ ዞን መታወቂያ"
          : "Oromia,East Shoa Id Card"}
      </Link>
    </div>
  );
}
