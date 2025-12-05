"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useLocale } from "@/lib/use-locale";

interface Administrator {
  id: string;
  name: string;
  description: string | null;
  image: string;
  createdAt: string;
  updatedAt: string;
}

export default function Administrator() {
  const { locale } = useLocale();
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdministrators();
  }, []);

  const fetchAdministrators = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/administration", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch administrators");
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setAdministrators(result.data);
      } else {
        setAdministrators([]);
      }
    } catch (err: any) {
      console.error("Error fetching administrators:", err);
      setError(err.message || "Failed to load administrators");
      setAdministrators([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 animate-pulse">
              <div className="h-12 bg-muted rounded w-3/4"></div>
              <div className="h-6 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>
            <div className="aspect-[4/5] bg-muted rounded-lg"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return null; // Don't show error, just don't render the section
  }

  if (administrators.length === 0) {
    return null; // Don't render if no data
  }

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {administrators.map((admin) => (
          <div
            key={admin.id}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-16 last:mb-0"
          >
            {/* Left Side - Text Content */}
            <div className="space-y-6 order-2 lg:order-1">
              {/* Name - Large, dark, serif-like font */}
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                {admin.name}
              </h2>

              {/* Role/Title - Teal, uppercase, sans-serif */}
              <p className="text-lg sm:text-xl font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide">
                {locale === "or"
                  ? "Bulchiinsa"
                  : locale === "am"
                  ? "አስተዳደር"
                  : "Administration"}
              </p>

              {/* Message Heading */}
              <div className="pt-4">
                <p className="text-sm sm:text-base text-muted-foreground italic mb-3">
                  {locale === "or"
                    ? "Ergaa Bulchiinsaa:"
                    : locale === "am"
                    ? "የአስተዳደር መልዕክት:"
                    : "Administration Message:"}
                </p>

                {/* Description/Message */}
                {admin.description ? (
                  <p className="text-base sm:text-lg text-muted-foreground italic leading-relaxed">
                    {admin.description}
                  </p>
                ) : (
                  <p className="text-base sm:text-lg text-muted-foreground italic leading-relaxed">
                    {locale === "or"
                      ? "Baga nagaan dhufteefi galata galchifna. Akka gaarii dhuftan Tajaajila East Shoa keessatti fudhachuu dandeessu."
                      : locale === "am"
                      ? "እንኳን ደህና መጡ። እናመሰግናለን። ወደ ምስራቅ ሸዋ ሴቪስ እንኳን ደህና መጡ።"
                      : "Welcome and thank you for visiting our pages. Welcome to East Shoa Services."}
                  </p>
                )}
              </div>
            </div>

            {/* Right Side - Image */}
            <div className="relative aspect-[4/3] lg:aspect-[3/2] rounded-lg overflow-hidden shadow-2xl order-1 lg:order-2">
              {admin.image ? (
                <Image
                  src={`/api/filedata/${admin.image}`}
                  alt={admin.name}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                  <span className="text-6xl font-bold text-primary/50">
                    {admin.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
