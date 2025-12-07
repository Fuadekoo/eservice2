export interface SignUpFormData {
  name: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  otpCode?: string;
}

export interface SignUpStep {
  step: "details" | "otp" | "password";
}

export interface SignUpResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    id: string;
    username: string;
    phoneNumber: string;
    role: {
      id: string;
      name: string;
    } | null;
  };
}

export interface OTPResponse {
  success: boolean;
  message?: string;
  error?: string;
  otpCode?: number; // Only in development
}

