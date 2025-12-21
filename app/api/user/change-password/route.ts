import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import prisma from "@/lib/db";
import bcryptjs from "bcryptjs";

// POST - Change password (with current password verification) (requires profile:change-password permission)
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const { response, userId } = await requirePermission(request, "profile:change-password");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          error: "Unauthorized" 
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { 
          success: false,
          error: "Current password and new password are required" 
        },
        { status: 400 }
      );
    }

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: "User not found" 
        },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordValid = await bcryptjs.compare(
      currentPassword,
      user.password || ""
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          success: false,
          error: "Current password is incorrect" 
        },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { 
        success: true,
        message: "Password changed successfully" 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to change password" 
      },
      { status: 500 }
    );
  }
}

