"use client";

import { Navbar } from "@/components/guest/navbar";
import { Footer } from "@/components/guest/footer";
import { Body } from "@/components/guest/body";

export default function Page() {
  return (
    <div className="flex flex-col">
      <Navbar />
      <Body />
      <Footer />
    </div>
  );
}
