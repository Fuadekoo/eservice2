"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { useLocale } from "@/lib/use-locale";

interface About {
  id: string;
  name: string;
  description: string | null;
  image: string;
  createdAt: string;
  updatedAt: string;
}

export default function About() {
  const { locale } = useLocale();
  const [aboutSections, setAboutSections] = useState<About[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAboutSections();
  }, []);

  const fetchAboutSections = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/about", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch about sections");
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setAboutSections(result.data);
      } else {
        setAboutSections([]);
      }
    } catch (err: any) {
      console.error("Error fetching about sections:", err);
      setError(err.message || "Failed to load about sections");
      setAboutSections([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {locale === "or"
                ? "Waa'ee Keenya"
                : locale === "am"
                ? "ስለ እኛ"
                : "About Us"}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-muted"></div>
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return null; // Don't show error, just don't render the section
  }

  if (aboutSections.length === 0) {
    return null; // Don't render if no data
  }

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {locale === "or"
              ? "Waa'ee Keenya"
              : locale === "am"
              ? "ስለ እኛ"
              : "About Us"}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {locale === "or"
              ? "Waa'ee mootummaa East Shoa keessatti beeku"
              : locale === "am"
              ? "ስለ ምስራቅ ሸዋ መንግስት ይወቁ"
              : "Learn more about East Shoa Government"}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {aboutSections.map((about) => (
            <Card
              key={about.id}
              className="group overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-card"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                {about.image ? (
                  <Image
                    src={`/api/filedata/${about.image}`}
                    alt={about.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                    <span className="text-2xl font-bold text-primary/50">
                      {about.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {about.name}
                </h3>
                {about.description && (
                  <p className="text-muted-foreground line-clamp-4">
                    {about.description}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
