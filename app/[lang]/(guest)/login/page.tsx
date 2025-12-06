"use client";

import { authenticate } from "@/actions/common/authentication";
import Logo from "@/components/layout/logo";
import Theme from "@/components/layout/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRegistration } from "@/hooks/useRegistration";
import useTranslation from "@/hooks/useTranslation";
import { loginSchema } from "@/lib/zodSchema";
import { Eye, EyeOff, KeyRound, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function Page() {
  const { lang, credentials } = useParams<{
    lang: string;
    credentials?: string[];
  }>();
  const router = useRouter();
  const { t } = useTranslation();
  const [authError, setAuthError] = useState<string | null>(null);
  const { onSubmit, validationErrors, register, setValue, isLoading } =
    useRegistration(authenticate, loginSchema, (state) => {
      if (state.status) {
        setAuthError(null);
        router.push(`/${lang}/dashboard`);
      } else {
        // Set authentication error message
        setAuthError(state.message || "Authentication failed");
      }
    });
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const [username, password] = credentials ?? ["", ""];
    if (username && password) {
      setValue("username", username);
      setValue("password", password);
      onSubmit();
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Theme Toggle - Top Right Corner */}
      <div className="absolute top-4 right-4 z-50">
        <Theme />
      </div>

      <Card className="w-full max-w-4xl bg-background/40 backdrop-blur-3xl border border-background/30 overflow-hidden grid md:grid-cols-2">
        <div className="p-5 md:p-10 flex gap-5 flex-col bg-background/50">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="flex-1 flex flex-col gap-5 justify-center">
            {/* Authentication Error Display */}
            {authError && (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-800 dark:text-red-400 mb-1">
                      {authError.includes("Account Blocked") ||
                      authError.includes("blocked")
                        ? "Account Blocked"
                        : "Authentication Error"}
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {authError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t("auth.username")}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("auth.username")}
                    className="pl-10 w-full"
                    {...register("username")}
                    onChange={(e) => {
                      register("username").onChange(e);
                      setAuthError(null);
                    }}
                  />
                </div>
                {validationErrors.username && (
                  <p className="text-xs text-red-500">
                    {validationErrors.username}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t("auth.password")}
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("auth.password")}
                    className="pl-10 pr-10 w-full"
                    type={hidden ? "password" : "text"}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setHidden((prev) => !prev)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {hidden ? (
                      <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-xs text-red-500">
                    {validationErrors.password}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("common.loading") : t("auth.login")}
              </Button>
            </form>
          </div>
        </div>
        <div className="max-md:hidden size-full grid place-content-center bg-gradient-to-br from-primary/10 to-secondary/10">
          <Link href={"/"}>
            <Image
              alt="logo image"
              src={"/logo.png"}
              width={2000}
              height={2000}
              className="size-80"
            />
          </Link>
        </div>
      </Card>
    </div>
  );
}
