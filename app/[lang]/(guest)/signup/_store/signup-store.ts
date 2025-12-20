import { create } from "zustand";
import { toast } from "sonner";
import { normalizePhoneNumber } from "@/lib/utils/phone-number";
import {
  SignUpFormData,
  SignUpResponse,
  OTPResponse,
} from "../_types";

// Countdown timer interval reference
let countdownInterval: NodeJS.Timeout | null = null;

interface SignUpStore {
  // State
  step: "details" | "otp" | "password";
  phoneNumber: string;
  otpVerified: boolean;
  countdown: number;
  isSendingOTP: boolean;
  isVerifyingOTP: boolean;
  isRegistering: boolean;

  // Actions
  setStep: (step: "details" | "otp" | "password") => void;
  setPhoneNumber: (phone: string) => void;
  setOtpVerified: (verified: boolean) => void;
  setCountdown: (seconds: number) => void;
  sendOTP: (phoneNumber: string) => Promise<OTPResponse>;
  verifyOTP: (phoneNumber: string, otpCode: string) => Promise<OTPResponse>;
  register: (data: SignUpFormData) => Promise<SignUpResponse>;
  reset: () => void;
}

export const useSignUpStore = create<SignUpStore>((set, get) => ({
  // Initial state
  step: "details",
  phoneNumber: "",
  otpVerified: false,
  countdown: 0,
  isSendingOTP: false,
  isVerifyingOTP: false,
  isRegistering: false,

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
      // const response = await fetch("/api/hahusms/send-otp", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({ phoneNumber: normalizedPhone }),
      // });

      // OLD: Using old OTP API (commented out)
      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: normalizedPhone }),
      });

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
      // const response = await fetch("/api/hahusms/verify-otp", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     code: otpCode,
      //   }),
      // });

      // OLD: Using old OTP verification API (commented out)
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: normalizedPhone,
          code: otpCode,
        }),
      });

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

  // Register user
  register: async (data: SignUpFormData) => {
    if (!get().otpVerified) {
      toast.error("Error", {
        description: "Please verify OTP first",
      });
      return {
        success: false,
        error: "OTP not verified",
      };
    }

    set({ isRegistering: true });
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          phoneNumber: normalizePhoneNumber(data.phoneNumber),
          password: data.password,
          otpCode: data.otpCode,
        }),
      });

      const result: SignUpResponse = await response.json();

      if (result.success && result.data) {
        // Automatically log in the user after successful registration
        try {
          const loginResponse = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              phoneNumber: normalizePhoneNumber(data.phoneNumber),
              password: data.password,
            }),
          });

          const loginResult = await loginResponse.json();

          if (loginResult.success && loginResult.status) {
            set({ isRegistering: false });
            toast.success("Success", {
              description: "Account created and logged in successfully",
            });
            // Return success with login flag
            return {
              ...result,
              autoLoggedIn: true,
            };
          } else {
            // Registration succeeded but login failed
            set({ isRegistering: false });
            toast.success("Account created", {
              description: "Please login with your credentials",
            });
            return {
              ...result,
              autoLoggedIn: false,
            };
          }
        } catch (loginError: any) {
          console.error("Auto-login error:", loginError);
          // Registration succeeded but login failed
          set({ isRegistering: false });
          toast.success("Account created", {
            description: "Please login with your credentials",
          });
          return {
            ...result,
            autoLoggedIn: false,
          };
        }
      } else {
        set({ isRegistering: false });
        toast.error("Error", {
          description: result.error || "Registration failed",
        });
        return result;
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      set({ isRegistering: false });
      toast.error("Error", {
        description: "Registration failed",
      });
      return {
        success: false,
        error: error.message || "Registration failed",
      };
    }
  },

  // Reset store
  reset: () => {
    set({
      step: "details",
      phoneNumber: "",
      otpVerified: false,
      countdown: 0,
      isSendingOTP: false,
      isVerifyingOTP: false,
      isRegistering: false,
    });
  },
}));

