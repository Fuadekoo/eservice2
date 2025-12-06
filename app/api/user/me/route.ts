import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// GET - Get current authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: session.user.id,
        username: session.user.username,
        phoneNumber: session.user.phoneNumber,
        role: session.user.role,
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

