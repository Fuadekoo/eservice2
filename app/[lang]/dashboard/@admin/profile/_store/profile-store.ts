import { create } from "zustand";
import { UserProfile, ProfileUpdateData, PasswordChangeData } from "../_types";
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
} from "@/actions/common/profile";
import { toast } from "sonner";

interface ProfileStore {
  // State
  profile: UserProfile | null;
  isLoading: boolean;
  isUpdating: boolean;
  isChangingPassword: boolean;

  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
  changeUserPassword: (data: PasswordChangeData) => Promise<void>;
  resetPasswordForm: () => void;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  // Initial state
  profile: null,
  isLoading: false,
  isUpdating: false,
  isChangingPassword: false,

  // Fetch user profile
  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const result = await getUserProfile();

      if (result.success && result.user) {
        set({
          profile: {
            ...result.user,
            createdAt: new Date(result.user.createdAt),
            updatedAt: new Date(result.user.updatedAt),
          },
          isLoading: false,
        });
      } else {
        const errorMessage = result.error || "Failed to fetch profile";
        console.error("Failed to fetch profile:", errorMessage);
        set({ isLoading: false });
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      const errorMessage = error.message || "Failed to fetch profile";
      set({ isLoading: false });
      toast.error(errorMessage);
    }
  },

  // Update profile
  updateProfile: async (data: ProfileUpdateData) => {
    set({ isUpdating: true });
    try {
      const result = await updateUserProfile({
        username: data.username.trim(),
      });

      if (result.success) {
        // Refresh profile data
        await get().fetchProfile();
        set({ isUpdating: false });
        toast.success(result.message || "Profile updated successfully");
      } else {
        set({ isUpdating: false });
        throw new Error(result.error || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      set({ isUpdating: false });
      toast.error(error.message || "Failed to update profile");
      throw error;
    }
  },

  // Change password
  changeUserPassword: async (data: PasswordChangeData) => {
    set({ isChangingPassword: true });
    try {
      const result = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (result.success) {
        set({ isChangingPassword: false });
        toast.success(result.message || "Password changed successfully");
        // Reset password form
        get().resetPasswordForm();
      } else {
        set({ isChangingPassword: false });
        throw new Error(result.error || "Failed to change password");
      }
    } catch (error: any) {
      console.error("Error changing password:", error);
      set({ isChangingPassword: false });
      toast.error(error.message || "Failed to change password");
      throw error;
    }
  },

  // Reset password form (for external use)
  resetPasswordForm: () => {
    // This is just a placeholder - actual form reset should be handled in the component
    // But we can use this to signal a reset if needed
  },
}));

