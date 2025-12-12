"use client";

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
import useTranslation from "@/hooks/useTranslation";
import { Eye, EyeOff, KeyRound, Phone, ArrowLeft, Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useLoginStore } from "./_store/login-store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "./_schema";

export default function Page() {
  const { lang, credentials } = useParams<{
    lang: string;
    credentials?: string[];
  }>();
  const router = useRouter();
  const { t } = useTranslation();

  // Use Zustand store
  const {
    formData,
    isLoading,
    error: authError,
    callbackUrl,
    isPasswordVisible,
    setPhoneNumber,
    setPassword,
    setError,
    setCallbackUrl,
    togglePasswordVisibility,
    login,
    reset,
  } = useLoginStore();

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phoneNumber: formData.phoneNumber,
      password: formData.password,
    },
  });

  // Sync form values with store
  const phoneNumberValue = watch("phoneNumber") || "";
  const passwordValue = watch("password") || "";

  useEffect(() => {
    if (phoneNumberValue && phoneNumberValue !== formData.phoneNumber) {
      setPhoneNumber(phoneNumberValue);
    }
  }, [phoneNumberValue, formData.phoneNumber, setPhoneNumber]);

  useEffect(() => {
    if (passwordValue !== formData.password) {
      setPassword(passwordValue);
    }
  }, [passwordValue, formData.password, setPassword]);

  // Get callback URL from query params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const url = searchParams.get("callbackUrl");
      if (url) {
        setCallbackUrl(url);
      }

      // Check for error in URL params
      const errorParam = searchParams.get("error");
      if (errorParam) {
        try {
          const decodedError = decodeURIComponent(errorParam);
          setError(decodedError);
        } catch {
          setError(errorParam);
        }
      }
    }
  }, [setCallbackUrl, setError]);

  // Handle credentials from URL params (if provided)
  useEffect(() => {
    const [phoneNumber, password] = credentials ?? ["", ""];
    if (phoneNumber && password) {
      setValue("phoneNumber", phoneNumber);
      setValue("password", password);
      setPhoneNumber(phoneNumber);
      setPassword(password);
      // Auto-submit if credentials are provided
      handleSubmit(onSubmit)();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Form submission handler
  const onSubmit = async (data: { phoneNumber: string; password: string }) => {
    setPhoneNumber(data.phoneNumber);
    setPassword(data.password);
    setError(null);

    const result = await login(data);

    if (result.status) {
      // Use stored callback URL or default to dashboard
      if (callbackUrl) {
        router.push(decodeURIComponent(callbackUrl));
      } else {
        router.push(`/${lang}/dashboard`);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Back to Home Button - Top Left Corner */}
      <div className="absolute top-4 left-4 z-50">
        <Link href={`/${lang}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">
              {t("guest.back") || "Back to Home"}
            </span>
          </Button>
        </Link>
      </div>

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
            {authError && (() => {
              // Determine error type and message
              let errorTitle = t("guest.authenticationError");
              let errorMessage = authError;

              if (authError.includes("Invalid Phone Number") || authError.includes("Invalid phone number")) {
                errorTitle = t("guest.userNotFound") || "User Not Found";
                errorMessage = t("guest.userNotFoundMessage") || "The phone number you entered is not registered. Please check your phone number or create a new account.";
              } else if (authError.includes("Invalid Password") || authError.includes("Invalid password")) {
                errorTitle = t("guest.wrongPassword") || "Wrong Password";
                errorMessage = t("guest.wrongPasswordMessage") || "The password you entered is incorrect. Please try again or reset your password.";
              } else if (authError.includes("Account Blocked") || authError.includes("blocked") || authError.includes("Account Inactive")) {
                errorTitle = t("guest.accountBlocked") || "Account Blocked";
                errorMessage = authError;
              } else {
                errorMessage = authError;
              }

              return (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0"
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
                        {errorTitle}
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t("guest.phoneNumber")}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("guest.phonePlaceholder")}
                    className="pl-10 w-full"
                    type="tel"
                    {...register("phoneNumber", {
                      onChange: (e) => {
                        setPhoneNumber(e.target.value);
                        setError(null);
                      },
                    })}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="text-xs text-red-500">
                    {errors.phoneNumber.message}
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
                    type={isPasswordVisible ? "text" : "password"}
                    {...register("password", {
                      onChange: (e) => {
                        setPassword(e.target.value);
                        setError(null);
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {isPasswordVisible ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("common.loading") : t("auth.login")}
              </Button>

              <div className="text-center text-sm">
                <Link
                  href={`/${lang}/forgetPassword`}
                  className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  {t("guest.forgotPassword")}
                </Link>
              </div>

              <div className="text-center text-sm text-muted-foreground pt-2">
                {t("guest.dontHaveAccount")}{" "}
                <Link
                  href={`/${lang}/signup`}
                  className="underline-offset-2 hover:underline text-foreground font-medium"
                >
                  {t("guest.createAccount")}
                </Link>
              </div>
            </form>
          </div>
        </div>
        <div className="max-md:hidden size-full flex flex-col items-center justify-center gap-6 bg-linear-to-br from-primary/10 to-secondary/10 p-8">
          <Link href={"/"}>
            <Image
              alt="logo image"
              src={"/logo.png"}
              width={2000}
              height={1000}
              className="size-64"
            />
          </Link>
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">
              {t("guest.welcomeToService")}
            </h2>
            <p className="text-muted-foreground">
              {t("guest.signInDescription")}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
