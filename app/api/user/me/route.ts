import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";

// GET - Get current authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        phoneNumber: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        phoneNumber: user.phoneNumber,
        role: user.role?.name || session.user.role,
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching current user:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch user",
      },
      { status: 500 }
    );
  }
}

