"use server";

import prisma from "@/lib/db";
import { auth } from "@/auth";
import bcryptjs from "bcryptjs";
import { revalidatePath } from "next/cache";

// Get user profile
export async function getUserProfile() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return {
      success: false,
      error: "Failed to fetch profile",
    };
  }
}

// Update user profile
export async function updateUserProfile(data: {
  username?: string;
  phone?: string;
}) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Check if username or phone already exists (if changed)
    if (data.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        return {
          success: false,
          error: "Username already exists",
        };
      }
    }

    if (data.phone) {
      const existingUser = await prisma.user.findFirst({
        where: {
          phoneNumber: data.phone,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        return {
          success: false,
          error: "Phone number already exists",
        };
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.username && { username: data.username }),
        ...(data.phone && { phone: data.phone }),
      },
    });

    revalidatePath("/en/dashboard/profile");

    return {
      success: true,
      message: "Profile updated successfully",
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: "Failed to update profile",
    };
  }
}

// Change password
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        password: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isPasswordValid = await bcryptjs.compare(
      data.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return {
        success: false,
        error: "Current password is incorrect",
      };
    }

    // Hash new password
    const hashedPassword = await bcryptjs.hash(data.newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return {
      success: true,
      message: "Password changed successfully",
    };
  } catch (error) {
    console.error("Error changing password:", error);
    return {
      success: false,
      error: "Failed to change password",
    };
  }
}
