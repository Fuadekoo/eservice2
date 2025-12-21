import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkPagePermission } from "@/lib/check-page-permission";

/**
 * GET - Check if current user has permission to access a page
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, allowed: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const path = searchParams.get("path") || "";

    if (!role) {
      return NextResponse.json(
        { success: false, allowed: false, error: "Role parameter is required" },
        { status: 400 }
      );
    }

    const result = await checkPagePermission(
      session.user.id,
      role,
      path
    );

    return NextResponse.json({
      success: true,
      allowed: result.allowed,
      error: result.error,
      permission: result.permission,
    });
  } catch (error: any) {
    console.error("Error checking page permission:", error);
    return NextResponse.json(
      {
        success: false,
        allowed: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

