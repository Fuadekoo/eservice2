"use client";

import Cookies from "js-cookie";

const LANGUAGE_COOKIE_NAME = "eservice-language";
const COOKIE_EXPIRY_DAYS = 365; // 1 year

export type Language = "en" | "am" | "or";

export const SUPPORTED_LANGUAGES: Language[] = ["en", "am", "or"];

export function getLanguageFromCookie(): Language {
  if (typeof window === "undefined") return "en";
  
  const cookieValue = Cookies.get(LANGUAGE_COOKIE_NAME);
  if (cookieValue && SUPPORTED_LANGUAGES.includes(cookieValue as Language)) {
    return cookieValue as Language;
  }
  return "en";
}

export function setLanguageCookie(language: Language): void {
  if (typeof window === "undefined") return;
  
  Cookies.set(LANGUAGE_COOKIE_NAME, language, {
    expires: COOKIE_EXPIRY_DAYS,
    path: "/",
    sameSite: "lax",
  });
}

export function removeLanguageCookie(): void {
  if (typeof window === "undefined") return;
  
  Cookies.remove(LANGUAGE_COOKIE_NAME, { path: "/" });
}

