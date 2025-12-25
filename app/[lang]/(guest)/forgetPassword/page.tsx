"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormOTPInput } from "@/components/form-otp";
import { ForgotPasswordSchema, forgotPasswordSchema } from "./_schema";
import { Loader2, Phone, KeyRound, Lock } from "lucide-react";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { useForgotPasswordStore } from "./_store/forgot-password-store";
import useTranslation from "@/hooks/useTranslation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params.lang || "en";
  const { t } = useTranslation();

  const {
    step,
    phoneNumber,
    otpVerified,
    countdown,
    isSendingOTP,
    isVerifyingOTP,
    isResetting,
    setStep,
    sendOTP,
    verifyOTP,
    resetPassword,
  } = useForgotPasswordStore();

  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      phoneNumber: "",
      newPassword: "",
      confirmPassword: "",
      otpCode: "",
    },
  });

  // Format countdown as SS (seconds only) or MM:SS if over 60 seconds
  const formatCountdown = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSendOTP = async () => {
    // Validate form before sending OTP
    const isValid = await form.trigger(["phoneNumber"]);
    if (!isValid) {
      return;
    }

    const phone = form.getValues("phoneNumber");
    await sendOTP(phone);
  };

  const handleVerifyOTP = async () => {
    const otpCode = form.getValues("otpCode");
    if (!otpCode) {
      return;
    }

    const normalizedPhone = phoneNumber || form.getValues("phoneNumber");
    await verifyOTP(normalizedPhone, otpCode);
  };

  const handleResetPassword = form.handleSubmit(async (data) => {
    const result = await resetPassword(data);
    if (result.success) {
      // Redirect to login page after successful password reset
      router.push(`/${lang}/login`);
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
                step === "phone"
                  ? (e) => {
                      e.preventDefault();
                      handleSendOTP();
                    }
                  : step === "otp"
                  ? (e) => {
                      e.preventDefault();
                      handleVerifyOTP();
                    }
                  : handleResetPassword
              }
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold mb-2">
                  {t("guest.resetPassword")}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {t("guest.resetPasswordDescription")}
                </p>
              </div>

              {step === "phone" ? (
                <>
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
                    disabled={form.formState.isSubmitting || isSendingOTP}
                    className="w-full"
                  >
                    {(form.formState.isSubmitting || isSendingOTP) && (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    )}
                    {isSendingOTP ? t("guest.sendingOTP") : t("guest.sendOTP")}
                  </Button>
                </>
              ) : step === "otp" ? (
                <>
                  {/* Countdown Timer */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        {t("guest.otpSentTo")}{" "}
                        <span className="font-semibold">{phoneNumber}</span>
                      </p>
                      {countdown > 0 ? (
                        <div className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {formatCountdown(countdown)}
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSendOTP}
                          disabled={isSendingOTP}
                        >
                          {isSendingOTP ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            t("guest.resend")
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  <FormOTPInput
                    control={form.control}
                    name="otpCode"
                    label={t("guest.otpCode")}
                    description={t("guest.otpDescription")}
                    length={6}
                  />

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("phone")}
                      className="flex-1"
                    >
                      {t("guest.back")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={form.formState.isSubmitting || isVerifyingOTP}
                      className="flex-1"
                    >
                      {(form.formState.isSubmitting || isVerifyingOTP) && (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      )}
                      {isVerifyingOTP
                        ? t("guest.verifying")
                        : t("guest.verifyContinue")}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg mb-4">
                    <p className="text-sm text-green-800 dark:text-green-300 text-center">
                      {t("guest.otpVerifiedReset")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {t("guest.newPassword")}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t("guest.newPasswordPlaceholder")}
                        className="pl-10 w-full"
                        type="password"
                        {...form.register("newPassword")}
                      />
                    </div>
                    {form.formState.errors.newPassword && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.newPassword.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t("guest.passwordMinLength")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {t("guest.confirmNewPassword")}
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t("guest.confirmNewPasswordPlaceholder")}
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
                      onClick={() => setStep("otp")}
                      className="flex-1"
                    >
                      {t("guest.back")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={form.formState.isSubmitting || isResetting}
                      className="flex-1"
                    >
                      {(form.formState.isSubmitting || isResetting) && (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      )}
                      {isResetting
                        ? t("guest.resetting")
                        : t("guest.resetPasswordButton")}
                    </Button>
                  </div>
                </>
              )}

              <div className="text-center text-sm text-muted-foreground pt-2">
                {t("guest.rememberPassword")}{" "}
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
              {t("guest.resetYourPassword")}
            </h2>
            <p className="text-muted-foreground">
              {t("guest.resetPasswordSidebar")}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
