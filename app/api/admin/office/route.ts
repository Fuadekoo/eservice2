import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";

/**
 * GET - Get the authenticated admin's office
 * Admins can have a staff relationship with an office to manage it
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 }
      );
    }

    const isAdmin = dbUser.role?.name?.toLowerCase() === "admin";
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Get the admin's office from staff relation (first one if multiple)
    const userStaff = await prisma.staff.findFirst({
      where: { userId: userId },
      include: {
        office: true,
      },
    });

    if (!userStaff) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "No office assigned to admin",
      });
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
    console.error("❌ Error fetching admin office:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch office",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Assign an office to the admin (create staff relationship)
 * Body: { officeId: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 }
      );
    }

    const isAdmin = dbUser.role?.name?.toLowerCase() === "admin";
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { officeId } = body;

    if (!officeId) {
      return NextResponse.json(
        { success: false, error: "Office ID is required" },
        { status: 400 }
      );
    }

    // Verify office exists
    const office = await prisma.office.findUnique({
      where: { id: officeId },
    });

    if (!office) {
      return NextResponse.json(
        { success: false, error: "Office not found" },
        { status: 404 }
      );
    }

    // Check if admin already has a staff record for this office
    const existingStaff = await prisma.staff.findFirst({
      where: {
        userId: userId,
        officeId: officeId,
      },
    });

    if (existingStaff) {
      // Return existing office
      const officeData = {
        ...office,
        startedAt: office.startedAt.toISOString(),
        createdAt: office.createdAt.toISOString(),
        updatedAt: office.updatedAt.toISOString(),
      };

      return NextResponse.json({
        success: true,
        data: officeData,
        message: "Office already assigned",
      });
    }

    // Create staff relationship for admin with this office
    await prisma.staff.create({
      data: {
        userId: userId,
        officeId: officeId,
      },
    });

    // Fetch the office with all data
    const updatedOffice = await prisma.office.findUnique({
      where: { id: officeId },
    });

    if (!updatedOffice) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch office after assignment" },
        { status: 500 }
      );
    }

    const officeData = {
      ...updatedOffice,
      startedAt: updatedOffice.startedAt.toISOString(),
      createdAt: updatedOffice.createdAt.toISOString(),
      updatedAt: updatedOffice.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: officeData,
      message: "Office assigned successfully",
    });
  } catch (error: any) {
    console.error("❌ Error assigning admin office:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to assign office",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove office assignment from admin
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 }
      );
    }

    const isAdmin = dbUser.role?.name?.toLowerCase() === "admin";
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Remove all staff relationships for this admin
    await prisma.staff.deleteMany({
      where: {
        userId: userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Office assignment removed successfully",
    });
  } catch (error: any) {
    console.error("❌ Error removing admin office:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to remove office assignment",
      },
      { status: 500 }
    );
  }
}
