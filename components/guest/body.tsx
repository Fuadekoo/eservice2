"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { governmentWindows } from "@/lib/windows-data";
import { useLocale } from "@/lib/use-locale";
import Link from "next/link";
import Image from "next/image";
import { GalleryDisplay } from "@/components/gallery/gallery-display";
import Service from "@/components/guest/service";
import About from "@/components/guest/about";
import Administrator from "@/components/guest/adminstrator";

export function Body() {
  const router = useRouter();
  const { locale } = useLocale();
  const [selectedWindow, setSelectedWindow] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleApplyClick = (serviceId: number) => {
    const callbackUrl = encodeURIComponent(
      `/${locale}/dashboard/request?serviceId=${serviceId}`
    );
    router.push(`/${locale}/login?callbackUrl=${callbackUrl}`);
  };

  const selectedWindowData = selectedWindow
    ? governmentWindows.find((w) => w.id === selectedWindow)
    : null;

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-primary dark:to-accent text-white dark:text-primary-foreground py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Image
                src="/logo.png"
                alt="East Shoa Services Logo"
                width={200}
                height={200}
                className="object-contain"
                priority
              />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white dark:text-primary-foreground">
              {locale === "or"
                ? "Akka Gaarii Dhuftan Tajaajila East Shoa"
                : locale === "am"
                ? "ወደ ምስራቅ ሸዋ ሴቪስ እንኳን ደህና መጡ"
                : "Welcome to East Shoa Services"}
            </h2>
            <p className="text-lg mb-8 text-white/95 dark:text-primary-foreground/90">
              {locale === "or"
                ? "Tajaajila mootummaa interneetiin argachuu, yeroo kamiyyuu, bakka kamiyyuu"
                : locale === "am"
                ? "የመንግስት ሴቪስ በመስመር ላይ ይደረሱ፣ በማንኛውም ጊዜ፣ በማንኛውም ቦታ"
                : "Access government services online, anytime, anywhere"}
            </p>
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Input
                  type="text"
                  placeholder={
                    locale === "or"
                      ? "Tajaajila barbaadi..."
                      : locale === "am"
                      ? "ሴቪስ ፈልግ..."
                      : "Search for a service..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 rounded-lg bg-transparent border-white text-white placeholder:text-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-gray-100">
                  <Search size={20} />
                </button>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <Link href={`/${locale}/login`}>
                <Button
                  size="lg"
                  className="bg-white text-blue-700 hover:bg-white/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 px-8 py-6 text-lg"
                >
                  {locale === "or"
                    ? "Eegumsa Jalqabi"
                    : locale === "am"
                    ? "ጀምር"
                    : "Get Started"}
                </Button>
              </Link>
            </div>
            {/* Login and Service Access */}
            <div className="mt-8">
              <div className="bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto border border-white/30 dark:border-white/20">
                <h3 className="text-xl font-semibold mb-3 text-white dark:text-primary-foreground">
                  {locale === "or"
                    ? "Tajaajila Barbaadduu?"
                    : locale === "am"
                    ? "አገልግሎት ትፈልጋለህ?"
                    : "Need Government Services?"}
                </h3>
                <p className="text-sm mb-4 text-white/95 dark:text-primary-foreground/90">
                  {locale === "or"
                    ? "Gaafii keessan ergaa, tajaajila keessan bakka kamillee, yeroo kamillee fayyadamaa."
                    : locale === "am"
                    ? "ጥያቄዎን ይላኩ፣ አገልግሎትዎን በማንኛውም ቦታ፣ በማንኛውም ጊዜ ይድረሱ።"
                    : "Submit your request, then access your service anywhere, anytime."}
                </p>
                <Link href={`/${locale}/login`}>
                  <Button
                    size="lg"
                    className="w-full bg-white text-primary hover:bg-white/90 border-white/30 dark:bg-white/20 dark:hover:bg-white/30 dark:text-primary-foreground"
                  >
                    {locale === "or"
                      ? "Seenuu"
                      : locale === "am"
                      ? "ግባ"
                      : "Login"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section - Fetched from Database */}
      <About />

      {/* Administrator Section - Fetched from Database */}
      <Administrator />

      {/* Services Section - Fetched from Database */}
      <Service />

      {/* Window Services Modal */}
      {selectedWindow && selectedWindowData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-primary text-primary-foreground p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {locale === "or"
                  ? selectedWindowData.nameOr
                  : locale === "am"
                  ? selectedWindowData.nameAm
                  : selectedWindowData.name}
              </h2>
              <button
                onClick={() => setSelectedWindow(null)}
                className="hover:opacity-80"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {selectedWindowData.services.map((service) => (
                  <div
                    key={service.id}
                    className="border rounded-lg p-4 hover:border-primary transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">
                        {locale === "or"
                          ? service.nameOr
                          : locale === "am"
                          ? service.nameAm
                          : service.name}
                      </h3>
                      <ChevronRight
                        size={20}
                        className="text-muted-foreground"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedWindow(null);
                        handleApplyClick(service.id);
                      }}
                      className="mt-3"
                    >
                      {locale === "or"
                        ? "Gaafadhu"
                        : locale === "am"
                        ? "ያመልክቱ"
                        : "Apply Now"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Gallery Section */}
      <GalleryDisplay />
    </main>
  );
}
