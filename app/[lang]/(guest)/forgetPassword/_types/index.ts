export interface ForgotPasswordFormData {
  phoneNumber: string;
  otpCode?: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface OTPResponse {
  success: boolean;
  message?: string;
  error?: string;
  otpCode?: number; // Only in development
}
