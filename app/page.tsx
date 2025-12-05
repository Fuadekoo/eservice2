"use client";

import { Navbar } from "@/components/guest/navbar";
import { Footer } from "@/components/guest/footer";
import { Body } from "@/components/guest/body";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-auto">
      <Navbar />
      <Body />
      <Footer />
    </div>
  );
}
