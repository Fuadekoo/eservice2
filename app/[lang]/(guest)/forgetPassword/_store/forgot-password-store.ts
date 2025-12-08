import { create } from "zustand";
import { toast } from "sonner";
import { normalizePhoneNumber } from "@/lib/utils/phone-number";
import {
  ForgotPasswordFormData,
  ForgotPasswordResponse,
  OTPResponse,
} from "../_types";

// Countdown timer interval reference
let countdownInterval: NodeJS.Timeout | null = null;

interface ForgotPasswordStore {
  // State
  step: "phone" | "otp" | "password";
  phoneNumber: string;
  otpVerified: boolean;
  countdown: number;
  isSendingOTP: boolean;
  isVerifyingOTP: boolean;
  isResetting: boolean;

  // Actions
  setStep: (step: "phone" | "otp" | "password") => void;
  setPhoneNumber: (phone: string) => void;
  setOtpVerified: (verified: boolean) => void;
  setCountdown: (seconds: number) => void;
  sendOTP: (phoneNumber: string) => Promise<OTPResponse>;
  verifyOTP: (phoneNumber: string, otpCode: string) => Promise<OTPResponse>;
  resetPassword: (
    data: ForgotPasswordFormData
  ) => Promise<ForgotPasswordResponse>;
  reset: () => void;
}

export const useForgotPasswordStore = create<ForgotPasswordStore>(
  (set, get) => ({
    // Initial state
    step: "phone",
    phoneNumber: "",
    otpVerified: false,
    countdown: 0,
    isSendingOTP: false,
    isVerifyingOTP: false,
    isResetting: false,

    // Set step
    setStep: (step) => set({ step }),

    // Set phone number
    setPhoneNumber: (phone) => set({ phoneNumber: phone }),

    // Set OTP verified
    setOtpVerified: (verified) => set({ otpVerified: verified }),

    // Set countdown
    setCountdown: (seconds) => {
      set({ countdown: seconds });

      // Clear existing interval
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }

      // Start new countdown if seconds > 0
      if (seconds > 0) {
        countdownInterval = setInterval(() => {
          const current = get().countdown;
          if (current > 0) {
            set({ countdown: current - 1 });
          } else {
            if (countdownInterval) {
              clearInterval(countdownInterval);
              countdownInterval = null;
            }
          }
        }, 1000);
      }
    },

    // Send OTP
    sendOTP: async (phoneNumber: string) => {
      set({ isSendingOTP: true });
      try {
        const normalizedPhone = normalizePhoneNumber(phoneNumber);

        // NEW: Using Hahu SMS OTP API
        const response = await fetch("/api/hahusms/send-otp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phoneNumber: normalizedPhone }),
        });

        // OLD: Using old OTP API (commented out)
        // const response = await fetch("/api/otp/send", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        //   body: JSON.stringify({ phoneNumber: normalizedPhone }),
        // });

        const result: OTPResponse = await response.json();

        if (result.success) {
          set({
            phoneNumber: normalizedPhone,
            step: "otp",
            countdown: 60,
            isSendingOTP: false,
          });
          toast.success("Success", {
            description: "OTP sent to your phone number",
          });
        } else {
          set({ isSendingOTP: false });
          toast.error("Error", {
            description: result.error || "Failed to send OTP",
          });
        }

        return result;
      } catch (error: any) {
        console.error("Error sending OTP:", error);
        set({ isSendingOTP: false });
        toast.error("Error", {
          description: "Failed to send OTP",
        });
        return {
          success: false,
          error: error.message || "Failed to send OTP",
        };
      }
    },

    // Verify OTP
    verifyOTP: async (phoneNumber: string, otpCode: string) => {
      set({ isVerifyingOTP: true });
      try {
        const normalizedPhone = normalizePhoneNumber(phoneNumber);

        // NEW: Using Hahu SMS OTP Verification API
        const response = await fetch("/api/hahusms/verify-otp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: otpCode,
          }),
        });

        // OLD: Using old OTP verification API (commented out)
        // const response = await fetch("/api/otp/verify", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        //   body: JSON.stringify({
        //     phoneNumber: normalizedPhone,
        //     code: otpCode,
        //   }),
        // });

        const result: OTPResponse = await response.json();

        if (result.success) {
          set({
            otpVerified: true,
            step: "password",
            isVerifyingOTP: false,
          });
          toast.success("Success", {
            description: "OTP verified successfully",
          });
        } else {
          set({ isVerifyingOTP: false });
          toast.error("Error", {
            description: result.error || "Invalid OTP code",
          });
        }

        return result;
      } catch (error: any) {
        console.error("OTP verification error:", error);
        set({ isVerifyingOTP: false });
        toast.error("Error", {
          description: "Failed to verify OTP",
        });
        return {
          success: false,
          error: error.message || "Failed to verify OTP",
        };
      }
    },

    // Reset password
    resetPassword: async (data: ForgotPasswordFormData) => {
      if (!get().otpVerified) {
        toast.error("Error", {
          description: "Please verify OTP first",
        });
        return {
          success: false,
          error: "OTP not verified",
        };
      }

      set({ isResetting: true });
      try {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phoneNumber: normalizePhoneNumber(data.phoneNumber),
            otpCode: data.otpCode,
            newPassword: data.newPassword,
          }),
        });

        const result: ForgotPasswordResponse = await response.json();

        if (result.success) {
          set({ isResetting: false });
          toast.success("Success", {
            description: result.message || "Password reset successfully",
          });
        } else {
          set({ isResetting: false });
          toast.error("Error", {
            description: result.error || "Failed to reset password",
          });
        }

        return result;
      } catch (error: any) {
        console.error("Password reset error:", error);
        set({ isResetting: false });
        toast.error("Error", {
          description: "Failed to reset password",
        });
        return {
          success: false,
          error: error.message || "Failed to reset password",
        };
      }
    },

    // Reset store
    reset: () => {
      set({
        step: "phone",
        phoneNumber: "",
        otpVerified: false,
        countdown: 0,
        isSendingOTP: false,
        isVerifyingOTP: false,
        isResetting: false,
      });
    },
  })
);
