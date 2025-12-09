export interface LoginFormData {
  phoneNumber: string;
  password: string;
}

export interface LoginResponse {
  status: boolean;
  message?: string;
  error?: string;
}

export interface LoginStoreState {
  formData: LoginFormData;
  isLoading: boolean;
  error: string | null;
  callbackUrl: string | null;
  isPasswordVisible: boolean;
}
