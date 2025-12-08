import "./globals.css";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/sonner";
// import { PWARegister } from "@/components/pwa-register";
import { LanguageGate } from "@/components/languageGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "e-Service | Government Services Management System",
  description:
    "e-Service Government Services Management System for your needs with multi-tenant support and multi-language support",
  manifest: "/manifest",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "e-Service",
  },
  icons: {
    icon: [
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/logo.png", sizes: "180x180", type: "image/png" }],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Check cookies first (primary storage)
                  function getCookie(name) {
                    var value = "; " + document.cookie;
                    var parts = value.split("; " + name + "=");
                    if (parts.length === 2) return parts.pop().split(";").shift();
                    return null;
                  }
                  
                  var cookieLang = getCookie('eservice-language');
                  if (cookieLang && (cookieLang === 'en' || cookieLang === 'am' || cookieLang === 'or')) {
                    window.__ESERVICE_LANGUAGE__ = cookieLang;
                  } else {
                    // No cookie set, don't set default - let LanguageGate handle it
                    window.__ESERVICE_LANGUAGE__ = null;
                  }
                } catch (e) {
                  window.__ESERVICE_LANGUAGE__ = null;
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="fixed inset-0 h-dvh grid overflow-hidden bg-background text-foreground font-mono">
            {children}
          </div>
          <Toaster richColors />
          {/* <PWARegister /> */}
          <LanguageGate />
        </ThemeProvider>
      </body>
    </html>
  );
}
