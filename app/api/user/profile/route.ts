import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import prisma from "@/lib/db";

// GET - Get user profile (requires profile:read permission)
export async function GET(request: NextRequest) {
  try {
    // Check permission
    const { response, userId } = await requirePermission(request, "profile:read");
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
      return NextResponse.json(
        { 
          success: false,
          error: "User not found" 
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: true,
        user 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to fetch profile" 
      },
      { status: 500 }
    );
  }
}

// PUT - Update user profile (requires profile:update permission)
export async function PUT(request: NextRequest) {
  try {
    // Check permission
    const { response, userId } = await requirePermission(request, "profile:update");
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
    const { username, phone } = body;

    // Check if username or phone already exists (if changed)
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: username,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { 
            success: false,
            error: "Username already exists" 
          },
          { status: 400 }
        );
      }
    }

    if (phone) {
      const existingUser = await prisma.user.findFirst({
        where: {
          phoneNumber: phone,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { 
            success: false,
            error: "Phone number already exists" 
          },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username: username }),
        ...(phone && { phoneNumber: phone }),
      },
    });

    return NextResponse.json(
      { 
        success: true,
        message: "Profile updated successfully",
        user: updatedUser
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to update profile" 
      },
      { status: 500 }
    );
  }
}

