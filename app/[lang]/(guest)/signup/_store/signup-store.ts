import { create } from "zustand";
import { toast } from "sonner";
import { normalizePhoneNumber } from "@/lib/utils/phone-number";
import { SignUpFormData, SignUpResponse } from "../_types";

interface SignUpStore {
  // State
  step: "details" | "password";
  isRegistering: boolean;

  // Actions
  setStep: (step: "details" | "password") => void;
  register: (data: SignUpFormData) => Promise<SignUpResponse>;
  reset: () => void;
}

export const useSignUpStore = create<SignUpStore>((set, get) => ({
  // Initial state
  step: "details",
  isRegistering: false,

  // Set step
  setStep: (step) => set({ step }),
  // Register user
  register: async (data: SignUpFormData) => {
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
      isRegistering: false,
    });
  },
}));
