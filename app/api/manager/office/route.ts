import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";

/**
 * GET - Get the authenticated manager's office
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the authenticated user's office ID from staff relation
    const userStaff = await prisma.staff.findFirst({
      where: { userId: session.user.id },
      include: {
        office: true,
      },
    });

    if (!userStaff) {
      return NextResponse.json(
        { success: false, error: "User office not found" },
        { status: 403 }
      );
    }

    // Serialize dates properly
    const office = {
      ...userStaff.office,
      startedAt: userStaff.office.startedAt.toISOString(),
      createdAt: userStaff.office.createdAt.toISOString(),
      updatedAt: userStaff.office.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: office,
    });
  } catch (error: any) {
    console.error("❌ Error fetching manager office:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch office",
      },
      { status: 500 }
    );
  }
}
