import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/rbac";

// GET - Get available users for staff assignment (users not already staff in the manager's office) (requires staff:create permission)
export async function GET(request: NextRequest) {
  try {
    // Check permission
    const { response, userId } = await requirePermission(request, "staff:create");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the authenticated user's office ID from staff relation
    const userStaff = await prisma.staff.findFirst({
      where: { userId: userId },
      select: { officeId: true },
    });

    if (!userStaff) {
      return NextResponse.json(
        { success: false, error: "User office not found" },
        { status: 403 }
      );
    }

    const officeId = userStaff.officeId;

    // Get all users who are NOT already staff in this office
    const existingStaffUserIds = await prisma.staff.findMany({
      where: { officeId },
      select: { userId: true },
    });

    const existingUserIds = existingStaffUserIds.map((s) => s.userId);

    // Fetch users that are not already staff in this office
    const users = await prisma.user.findMany({
      where: {
        id: {
          notIn: existingUserIds,
        },
        isActive: true,
      },
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
      orderBy: {
        username: "asc",
      },
      take: 100, // Limit to 100 users
    });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    console.error("❌ Error fetching available users:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch available users",
      },
      { status: 500 }
    );
  }
}
