import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";

/**
 * GET - Get the manager for the authenticated staff's office
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
      select: { officeId: true },
    });

    if (!userStaff) {
      return NextResponse.json(
        { success: false, error: "Staff office not found" },
        { status: 403 }
      );
    }

    const officeId = userStaff.officeId;

    // Find manager role for this office
    const managerRole = await prisma.role.findFirst({
      where: {
        officeId: officeId,
        name: {
          in: ["manager", "Manager", "MANAGER", "office_manager"],
        },
      },
    });

    if (!managerRole) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "No manager assigned to this office",
      });
    }

    // Find user with manager role
    const managerUser = await prisma.user.findFirst({
      where: {
        roleId: managerRole.id,
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
    });

    if (!managerUser) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "Manager role exists but no user assigned",
      });
    }

    return NextResponse.json({
      success: true,
      data: managerUser,
    });
  } catch (error: any) {
    console.error("❌ Error fetching staff office manager:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch office manager",
      },
      { status: 500 }
    );
  }
}
