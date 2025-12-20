import { create } from "zustand";
import { LoginFormData, LoginResponse, LoginStoreState } from "../_types";
import { loginSchema } from "../_schema";
import { normalizePhoneNumber } from "@/lib/utils/phone-number";

interface LoginStore extends LoginStoreState {
  // Actions
  setFormData: (data: Partial<LoginFormData>) => void;
  setPhoneNumber: (phoneNumber: string) => void;
  setPassword: (password: string) => void;
  setError: (error: string | null) => void;
  setCallbackUrl: (url: string | null) => void;
  togglePasswordVisibility: () => void;
  login: (data: LoginFormData) => Promise<LoginResponse>;
  reset: () => void;
}

const initialState: LoginStoreState = {
  formData: {
    phoneNumber: "",
    password: "",
  },
  isLoading: false,
  error: null,
  callbackUrl: null,
  isPasswordVisible: false,
};

export const useLoginStore = create<LoginStore>((set, get) => ({
  ...initialState,

  // Set form data
  setFormData: (data: Partial<LoginFormData>) => {
    set((state) => ({
      formData: { ...state.formData, ...data },
    }));
  },

  // Set phone number
  setPhoneNumber: (phoneNumber: string) => {
    set((state) => ({
      formData: { ...state.formData, phoneNumber },
      error: null, // Clear error when user types
    }));
  },

  // Set password
  setPassword: (password: string) => {
    set((state) => ({
      formData: { ...state.formData, password },
      error: null, // Clear error when user types
    }));
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },

  // Set callback URL
  setCallbackUrl: (url: string | null) => {
    set({ callbackUrl: url });
  },

  // Toggle password visibility
  togglePasswordVisibility: () => {
    set((state) => ({
      isPasswordVisible: !state.isPasswordVisible,
    }));
  },

  // Login action
  login: async (data: LoginFormData): Promise<LoginResponse> => {
    try {
      // Validate form data
      const validatedData = loginSchema.parse(data);

      set({ isLoading: true, error: null });

      // Call API endpoint
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: normalizePhoneNumber(validatedData.phoneNumber),
          password: validatedData.password,
        }),
      });

      const result = await response.json();

      if (result.success && result.status) {
        set({ isLoading: false, error: null });
        return {
          status: true,
          message: result.message || "Login successful",
        };
      } else {
        // Set user-friendly error message
        const errorMessage = result.message || result.error || "Authentication failed";
        set({
          isLoading: false,
          error: errorMessage,
        });
        return {
          status: false,
          error: errorMessage,
        };
      }
    } catch (error: any) {
      console.error("Login error:", error);
      // Extract error message from validation errors or other errors
      let errorMessage = "Invalid credentials. Please try again.";
      
      if (error.errors?.[0]?.message) {
        errorMessage = error.errors[0].message;
      } else if (error.message) {
        // Map common error messages to user-friendly ones
        if (error.message.includes("Phone number") || error.message.includes("not found")) {
          errorMessage = "Phone number is not found";
        } else if (error.message.includes("Password") || error.message.includes("incorrect")) {
          errorMessage = "Password is incorrect";
        } else if (error.message.includes("blocked") || error.message.includes("inactive")) {
          errorMessage = "User is blocked - Your account is inactive. Please contact administrator to activate your account.";
        } else {
          errorMessage = error.message;
        }
      }
      
      set({ isLoading: false, error: errorMessage });
      return {
        status: false,
        error: errorMessage,
      };
    }
  },

  // Reset store
  reset: () => {
    set(initialState);
  },
}));
