"use client";
import React, { useEffect, useState } from "react";
import { X, Download, Sparkles } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

function isInstalled(): boolean {
  // PWA installed checks for different platforms
  if (typeof window === "undefined") return false;
  const standaloneMq = window.matchMedia?.(
    "(display-mode: standalone)"
  ).matches;
  // iOS Safari
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iosStandalone = (window as any).navigator?.standalone === true;
  const stored = localStorage.getItem("pwa_installed") === "1";
  return Boolean(standaloneMq || iosStandalone || stored);
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Listen for beforeinstallprompt and appinstalled
  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Ask user immediately when page loads and app is installable
      if (!isInstalled()) {
        setShowPrompt(true);
        // Trigger animation after mounting
        setTimeout(() => setIsVisible(true), 100);
      }
    };

    const onInstalled = () => {
      try {
        localStorage.setItem("pwa_installed", "1");
      } catch {}
      setIsVisible(false);
      setTimeout(() => {
        setShowPrompt(false);
        setDeferredPrompt(null);
      }, 300);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch {}
    // Hide with animation
    setIsVisible(false);
    setTimeout(() => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }, 300);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setShowPrompt(false), 300);
  };

  if (!showPrompt) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-[9999] max-w-sm w-[90vw] sm:w-96 
        transform transition-all duration-300 ease-out
        ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
    >
      <div className="relative overflow-hidden rounded-2xl shadow-2xl backdrop-blur-xl
        bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950
        border border-gray-200/50 dark:border-gray-700/50">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10 pointer-events-none" />
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 rounded-full
            text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300
            hover:bg-gray-100/80 dark:hover:bg-gray-800/80
            transition-all duration-200 z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative p-6">
          {/* Icon with gradient background */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl
              bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700
              flex items-center justify-center shadow-lg shadow-blue-500/25 dark:shadow-blue-600/30">
              <Download className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Install App
                </h3>
                <Sparkles className="w-4 h-4 text-yellow-500 dark:text-yellow-400 animate-pulse" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Get quick access and enhanced performance by installing our app on your device.
              </p>
            </div>
          </div>

          {/* Features list */}
          <div className="mt-4 space-y-2 px-1">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400" />
              <span>Works offline</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
              <span>Faster performance</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400" />
              <span>Home screen access</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm
                bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700
                text-gray-700 dark:text-gray-300
                transition-all duration-200 transform active:scale-95
                border border-gray-200 dark:border-gray-700"
            >
              Not now
            </button>
            <button
              onClick={handleInstallClick}
              className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm
                bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700
                dark:from-blue-500 dark:to-purple-600 dark:hover:from-blue-600 dark:hover:to-purple-700
                text-white shadow-lg shadow-blue-500/25 dark:shadow-blue-600/30
                transition-all duration-200 transform active:scale-95
                hover:shadow-xl hover:shadow-blue-500/30 dark:hover:shadow-blue-600/40"
            >
              Install Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
