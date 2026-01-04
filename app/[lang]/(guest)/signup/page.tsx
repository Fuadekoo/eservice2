"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignUpSchema, signUpSchema } from "./_schema";
import { Loader2, User, Phone, KeyRound, Lock } from "lucide-react";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSignUpStore } from "./_store/signup-store";
import useTranslation from "@/hooks/useTranslation";

export default function SignUpPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params.lang || "en";
  const { t } = useTranslation();

  const { step, isRegistering, setStep, register } = useSignUpStore();

  const form = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      name: "",
    },
  });

  const handleContinueToPassword = async () => {
    const isValid = await form.trigger(["name", "phoneNumber"]);
    if (!isValid) return;
    setStep("password");
  };

  const handleRegister = form.handleSubmit(async (data) => {
    const result = await register(data);
    if (result.success) {
      if (result.autoLoggedIn) {
        // User is automatically logged in, refresh and redirect to dashboard
        router.refresh();
        router.push(`/${lang}/dashboard`);
      } else {
        // Registration succeeded but auto-login failed, redirect to login
        router.push(`/${lang}/login`);
      }
    }
  });

  return (
    <div className="flex items-center justify-center p-4 relative">
      {/* Theme Toggle - Top Right Corner */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-4xl bg-background/40 backdrop-blur-3xl border border-background/30 overflow-hidden grid md:grid-cols-2">
        <div className="p-5 md:p-10 flex gap-5 flex-col bg-background/50 h-full overflow-y-auto">
          <div className="flex-1 flex flex-col gap-5 justify-center min-h-0">
            <form
              onSubmit={
                step === "details"
                  ? (e) => {
                      e.preventDefault();
                      handleContinueToPassword();
                    }
                  : handleRegister
              }
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold mb-2">
                  {t("guest.createAccountTitle")}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {t("guest.signUpDescription")}
                </p>
              </div>

              {step === "details" ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {t("guest.fullName")}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t("guest.fullNamePlaceholder")}
                        className="pl-10 w-full"
                        {...form.register("name")}
                      />
                    </div>
                    {form.formState.errors.name && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

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
                        {...form.register("phoneNumber")}
                      />
                    </div>
                    {form.formState.errors.phoneNumber && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.phoneNumber.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="w-full"
                  >
                    {form.formState.isSubmitting && (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    )}
                    {t("common.next")}
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {t("auth.password")}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t("guest.passwordPlaceholder")}
                        className="pl-10 w-full"
                        type="password"
                        {...form.register("password")}
                      />
                    </div>
                    {form.formState.errors.password && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.password.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t("guest.passwordMinLength")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {t("user.confirmPassword")}
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t("guest.confirmPasswordPlaceholder")}
                        className="pl-10 w-full"
                        type="password"
                        {...form.register("confirmPassword")}
                      />
                    </div>
                    {form.formState.errors.confirmPassword && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("details")}
                      className="flex-1"
                    >
                      {t("guest.back")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={form.formState.isSubmitting || isRegistering}
                      className="flex-1"
                    >
                      {(form.formState.isSubmitting || isRegistering) && (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      )}
                      {isRegistering
                        ? t("guest.creatingAccount")
                        : t("guest.register")}
                    </Button>
                  </div>
                </>
              )}

              <div className="text-center text-sm text-muted-foreground pt-2">
                {t("guest.alreadyHaveAccount")}{" "}
                <Link
                  href={`/${lang}/login`}
                  className="underline-offset-2 hover:underline text-foreground font-medium"
                >
                  {t("guest.signIn")}
                </Link>
              </div>
            </form>
          </div>
        </div>

        <div className="max-md:hidden size-full flex flex-col items-center justify-center gap-6 bg-linear-to-br from-primary/10 to-secondary/10 p-8">
          <Link href={`/${lang}`}>
            <Image
              alt="logo image"
              src={"/logo.png"}
              width={2000}
              height={2000}
              className="size-64"
            />
          </Link>
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">
              {t("guest.welcomeToService")}
            </h2>
            <p className="text-muted-foreground">{t("guest.joinUs")}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
