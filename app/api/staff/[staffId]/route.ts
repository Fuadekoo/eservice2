import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { normalizePhoneNumber } from "@/lib/utils/phone-number";
import bcryptjs from "bcryptjs";

/**
 * GET - Get a single staff by ID (requires staff:read permission)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> | { staffId: string } }
) {
  try {
    // Handle params as Promise or object
    const resolvedParams = await Promise.resolve(params);
    const { staffId } = resolvedParams;

    // Check permission
    const { response, userId } = await requirePermission(request, "staff:read");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the authenticated user's office ID
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

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            phoneNumber: true,
            isActive: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        office: {
          select: {
            id: true,
            name: true,
            roomNumber: true,
            address: true,
            status: true,
          },
        },
      },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Staff not found" },
        { status: 404 }
      );
    }

    // Verify staff belongs to user's office
    if (staff.officeId !== userStaff.officeId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: staff.id,
        userId: staff.userId,
        username: staff.user.username,
        phoneNumber: staff.user.phoneNumber,
        isActive: staff.user.isActive,
        role: staff.user.role,
        officeId: staff.officeId,
        office: staff.office,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching staff:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch staff",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update a staff member (requires staff:update permission)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> | { staffId: string } }
) {
  try {
    // Handle params as Promise or object
    const resolvedParams = await Promise.resolve(params);
    const { staffId } = resolvedParams;

    // Check permission
    const { response, userId } = await requirePermission(request, "staff:update");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user with role from database (for office verification)
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

    // Check if user is admin (for office verification)
    const roleName = dbUser.role?.name?.toLowerCase() || "";
    const isAdmin = roleName === "admin" || roleName === "administrator";

    const body = await request.json();
    const { userId: bodyUserId, officeId, username, phoneNumber, password, roleId } = body;

    // Get existing staff
    const existingStaff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { office: true, user: true },
    });

    if (!existingStaff) {
      return NextResponse.json(
        { success: false, error: "Staff not found" },
        { status: 404 }
      );
    }

    // Get manager's office ID
    const managerStaff = await prisma.staff.findFirst({
      where: { userId: userId },
      select: { officeId: true },
    });

    if (!managerStaff) {
      return NextResponse.json(
        { success: false, error: "Manager office not found" },
        { status: 403 }
      );
    }

    // If user is manager (not admin), verify they belong to the same office
    if (!isAdmin) {
      if (existingStaff.officeId !== managerStaff.officeId) {
        return NextResponse.json(
          {
            success: false,
            error: "You can only update staff from your own office",
          },
          { status: 403 }
        );
      }
    }

    // Update user if user details provided
    if (username || phoneNumber || password || roleId) {
      const userUpdateData: any = {};

      if (username) {
        // Check if username is already taken by another user
        const existingUserWithUsername = await prisma.user.findFirst({
          where: {
            username: username,
            id: { not: existingStaff.userId },
          },
        });

        if (existingUserWithUsername) {
          return NextResponse.json(
            {
              success: false,
              error: "Username already taken",
            },
            { status: 400 }
          );
        }
        userUpdateData.username = username;
      }

      if (phoneNumber) {
        const normalizedPhone = normalizePhoneNumber(phoneNumber);
        // Check if phone number is already taken by another user
        const existingUserWithPhone = await prisma.user.findFirst({
          where: {
            phoneNumber: normalizedPhone,
            id: { not: existingStaff.userId },
          },
        });

        if (existingUserWithPhone) {
          return NextResponse.json(
            {
              success: false,
              error: "Phone number already taken",
            },
            { status: 400 }
          );
        }
        userUpdateData.phoneNumber = normalizedPhone;
      }

      if (password && password.trim() !== "") {
        userUpdateData.password = await bcryptjs.hash(password, 12);
      }

      if (roleId) {
        // Validate that the role being assigned is a "staff" role, not "manager" or "admin"
        const role = await prisma.role.findUnique({
          where: { id: roleId },
          select: { id: true, name: true, officeId: true },
        });

        if (!role) {
          return NextResponse.json(
            {
              success: false,
              error: "Role not found",
            },
            { status: 404 }
          );
        }

        // Ensure the role belongs to the same office
        if (role.officeId !== managerStaff.officeId) {
          return NextResponse.json(
            {
              success: false,
              error: "Role does not belong to this office",
            },
            { status: 400 }
          );
        }

        // Prevent assigning manager or admin roles to staff members
        const roleNameLower = role.name.toLowerCase();
        if (
          roleNameLower === "manager" ||
          roleNameLower === "office_manager" ||
          roleNameLower === "admin" ||
          roleNameLower === "administrator"
        ) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Cannot assign manager or admin roles to staff members. Only staff roles are allowed.",
            },
            { status: 403 }
          );
        }

        userUpdateData.roleId = roleId;
      }

      // Update user
      await prisma.user.update({
        where: { id: existingStaff.userId },
        data: userUpdateData,
      });
    }

    // Update staff (officeId can only be changed by admin, but we always use manager's office)
    const staffUpdateData: any = {};
    // Always keep the manager's office ID
    staffUpdateData.officeId = managerStaff.officeId;

    const staff = await prisma.staff.update({
      where: { id: staffId },
      data: staffUpdateData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            phoneNumber: true,
            isActive: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        office: {
          select: {
            id: true,
            name: true,
            roomNumber: true,
            address: true,
            status: true,
          },
        },
      },
    });

    console.log(`✅ Updated staff: ${staff.id}`);

    return NextResponse.json({
      success: true,
      data: {
        id: staff.id,
        userId: staff.userId,
        username: staff.user.username,
        phoneNumber: staff.user.phoneNumber,
        isActive: staff.user.isActive,
        role: staff.user.role,
        officeId: staff.officeId,
        office: staff.office,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("❌ Error updating staff:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Staff not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update staff",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a staff member (requires staff:delete permission)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> | { staffId: string } }
) {
  try {
    // Handle params as Promise or object
    const resolvedParams = await Promise.resolve(params);
    const { staffId } = resolvedParams;

    // Check permission
    const { response, userId } = await requirePermission(request, "staff:delete");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user with role from database (for office verification)
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

    // Check if user is admin (for office verification)
    const roleName = dbUser.role?.name?.toLowerCase() || "";
    const isAdmin = roleName === "admin" || roleName === "administrator";

    // Get existing staff
    const existingStaff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { office: true },
    });

    if (!existingStaff) {
      return NextResponse.json(
        { success: false, error: "Staff not found" },
        { status: 404 }
      );
    }

    // Get manager's office ID
    const managerStaff = await prisma.staff.findFirst({
      where: { userId: userId },
      select: { officeId: true },
    });

    if (!managerStaff) {
      return NextResponse.json(
        { success: false, error: "Manager office not found" },
        { status: 403 }
      );
    }

    // If user is manager (not admin), verify they belong to the same office
    if (!isAdmin) {
      if (existingStaff.officeId !== managerStaff.officeId) {
        return NextResponse.json(
          {
            success: false,
            error: "You can only delete staff from your own office",
          },
          { status: 403 }
        );
      }
    }

    // Delete staff (cascade will handle related records)
    await prisma.staff.delete({ where: { id: staffId } });

    console.log(`✅ Deleted staff: ${staffId}`);

    return NextResponse.json({
      success: true,
      message: "Staff deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting staff:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Staff not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete staff",
      },
      { status: 500 }
    );
  }
}
