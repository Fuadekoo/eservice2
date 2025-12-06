import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { userUpdateSchema } from "@/app/[lang]/dashboard/@admin/userManagement/_schema";
import { normalizePhoneNumber } from "@/lib/utils/phone-number";
import bcryptjs from "bcryptjs";

// GET - Fetch a single user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Authenticate and authorize user (admin only)
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
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

    console.log("📥 Fetching user:", id);

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            office: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        staffs: {
          include: {
            office: {
              select: {
                id: true,
                name: true,
                address: true,
                phoneNumber: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const staff = user.staffs?.[0];
    const transformedUser = {
      id: user.id,
      name: user.username,
      email: null,
      phoneNumber: user.phoneNumber,
      phoneNumberVerified: user.phoneVerified,
      emailVerified: false,
      image: null,
      username: user.username,
      displayUsername: user.username,
      roleId: user.roleId,
      role: user.role
        ? {
            id: user.role.id,
            name: user.role.name,
            officeId: user.role.officeId,
            office: user.role.office,
          }
        : null,
      officeId: staff?.officeId || null,
      office: staff?.office || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return NextResponse.json({ success: true, data: transformedUser });
  } catch (error: any) {
    console.error("❌ Error fetching user:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch user",
      },
      { status: 500 }
    );
  }
}

// PATCH - Update a user (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Authenticate and authorize user (admin only)
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
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
    console.log(`📤 Updating user ${id}:`, {
      ...body,
      password: body.password ? "***" : undefined,
    });

    // Validate input (partial update)
    const validationResult = userUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("❌ Validation failed:", validationResult.error);
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check for conflicts if phone or username is being updated
    if (data.phoneNumber || data.username) {
      const normalizedPhone = data.phoneNumber
        ? normalizePhoneNumber(data.phoneNumber)
        : existingUser.phoneNumber;

      const usernameToCheck = data.username?.trim() || existingUser.username;

      const conflicts = await prisma.user.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(data.phoneNumber ? [{ phoneNumber: normalizedPhone }] : []),
            ...(data.username && data.username.trim() !== ""
              ? [{ username: usernameToCheck }]
              : []),
          ],
        },
      });

      if (conflicts) {
        return NextResponse.json(
          {
            success: false,
            error: "User with this phone number or username already exists",
          },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (data.phoneNumber) {
      updateData.phoneNumber = normalizePhoneNumber(data.phoneNumber);
    }

    if (data.username !== undefined) {
      updateData.username =
        data.username && data.username.trim() !== ""
          ? data.username.trim()
          : existingUser.username;
    }

    if (data.roleId !== undefined) {
      updateData.roleId = data.roleId || null;
    }

    // Update isActive if provided
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    // Update password if provided
    if (data.password && data.password.trim() !== "") {
      const hashedPassword = await bcryptjs.hash(data.password, 12);
      updateData.password = hashedPassword;
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Update staff relation if officeId is provided
    if (data.officeId !== undefined) {
      // Delete existing staff relations
      await prisma.staff.deleteMany({ where: { userId: id } });

      // Create new staff relation if officeId is provided
      if (data.officeId && data.officeId.trim() !== "") {
        await prisma.staff.create({
          data: {
            userId: id,
            officeId: data.officeId,
          },
        });
      }
    }

    // Fetch updated user with relations
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            office: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        staffs: {
          include: {
            office: {
              select: {
                id: true,
                name: true,
                address: true,
                phoneNumber: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!updatedUser) {
      throw new Error("Failed to fetch updated user");
    }

    const staff = updatedUser.staffs?.[0];
    const transformedUser = {
      id: updatedUser.id,
      name: updatedUser.username,
      email: null,
      phoneNumber: updatedUser.phoneNumber,
      phoneNumberVerified: updatedUser.phoneVerified,
      emailVerified: false,
      image: null,
      username: updatedUser.username,
      displayUsername: updatedUser.username,
      roleId: updatedUser.roleId,
      role: updatedUser.role
        ? {
            id: updatedUser.role.id,
            name: updatedUser.role.name,
            officeId: updatedUser.role.officeId,
            office: updatedUser.role.office,
          }
        : null,
      officeId: staff?.officeId || null,
      office: staff?.office || null,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    };

    console.log("✅ User updated successfully");

    return NextResponse.json({ success: true, data: transformedUser });
  } catch (error: any) {
    console.error("❌ Error updating user:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update user",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Authenticate and authorize user (admin only)
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
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

    console.log("🗑️ Deleting user:", id);

    // Check if user exists and get their role
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Prevent deletion of admin users
    const userRoleName = user.role?.name?.toLowerCase() || "";
    if (userRoleName === "admin" || userRoleName === "administrator") {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete admin users. Admin accounts are protected.",
        },
        { status: 403 }
      );
    }

    // Delete user (cascade will delete related records)
    await prisma.user.delete({ where: { id } });

    console.log("✅ User deleted successfully");

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting user:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete user",
      },
      { status: 500 }
    );
  }
}
