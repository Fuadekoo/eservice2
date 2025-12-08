"use client";

import React from "react";
import useTranslation from "@/hooks/useTranslation";
import { Navbar } from "@/components/guest/navbar";
import { Footer } from "@/components/guest/footer";
import About from "@/components/guest/about";

function Page() {
  const { t } = useTranslation();
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <About />
      </main>
      <Footer />
    </div>
  );
}

export default Page;
