import { create } from "zustand";
import { authenticate } from "@/actions/common/authentication";
import { LoginFormData, LoginResponse, LoginStoreState } from "../_types";
import { loginSchema } from "../_schema";

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

      const result = await authenticate(validatedData);

      if (result.status) {
        set({ isLoading: false, error: null });
        return {
          status: true,
          message: result.message || "Login successful",
        };
      } else {
        set({
          isLoading: false,
          error: result.message || "Authentication failed",
        });
        return {
          status: false,
          error: result.message || "Authentication failed",
        };
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage =
        error.errors?.[0]?.message || error.message || "Invalid credentials";
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
