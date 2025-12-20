"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

export default function Logout() {
  const router = useRouter();
  const { lang } = useParams<{ lang: string }>();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success && result.status) {
        // Clear all cookies
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substr(0, eqPos) : c;
          document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${
            window.location.hostname
          }`;
        });

        // Clear localStorage and sessionStorage
        localStorage.clear();
        sessionStorage.clear();

        router.push(`/${lang}/login`);
        router.refresh();
      } else {
        console.error("Logout failed:", result.message);
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <Button onClick={handleLogout} variant="destructive" className="w-fit">
      Logout
    </Button>
  );
}
