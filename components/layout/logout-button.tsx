"use client";

import { Button } from "../ui/button";
import { LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { logout } from "@/actions/common/authentication";
import useMutation from "@/hooks/useMutation";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const { lang } = useParams<{ lang: string }>();
  const [open, setOpen] = useState(false);

  const [action, isLoading] = useMutation(logout, (state) => {
    if (state.status) {
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

      // Close dialog and redirect
      setOpen(false);
      router.push(`/${lang}/login`);
      router.refresh();
    }
  });

  const handleLogout = () => {
    action();
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
        >
          <LogOut className="h-4 w-4" />
          {lang === "am" ? "ውጣ" : "Logout"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-red-600" />
            {lang === "am" ? "እርግጠኛ ነህ?" : "Are you sure?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {lang === "am"
              ? "ከስርዓቱ መውጣት እንደምትፈልግ እርግጠኛ ነህ? ይህ ተግባር ተገላቢጦሽ አይደለም።"
              : "Are you sure you want to logout? This action cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {lang === "am" ? "ሰርዝ" : "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoading
              ? lang === "am"
                ? "በመውጣት ላይ..."
                : "Logging out..."
              : lang === "am"
              ? "ውጣ"
              : "Logout"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
