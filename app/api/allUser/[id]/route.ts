import { NextRequest, NextResponse } from "next/server";
import { prisma, executeWithRetry } from "@/lib/prisma";
import { userUpdateSchema } from "@/app/[domain]/manager/userManagement/_schema";
import { normalizePhoneNumber } from "@/lib/utils/phone-number";
import { hash } from "bcryptjs";
import { getAuthenticatedUser } from "@/lib/api/api-permissions";

// GET - Fetch a single user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle params as Promise or object
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log("📥 Fetching user:", id);

    const user = await executeWithRetry(
      () =>
        prisma.user.findUnique({
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
        }),
      2,
      10000
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const staff = user.staffs?.[0];
    const transformedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      phoneNumberVerified: user.phoneNumberVerified,
      emailVerified: user.emailVerified,
      image: user.image,
      username: user.username,
      displayUsername: user.displayUsername,
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

// PATCH - Update a user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle params as Promise or object
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    // Get authenticated user
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is manager
    const isManager =
      authUser.role?.name?.toLowerCase() === "manager" ||
      authUser.role?.name?.toLowerCase() === "office_manager";
    const isAdmin =
      authUser.role?.name?.toLowerCase() === "admin" ||
      authUser.role?.name?.toLowerCase() === "administrator";

    // If manager, check if they can edit this user
    if (isManager && !isAdmin) {
      // Get manager's office ID
      const managerStaff = await prisma.staff.findFirst({
        where: { userId: authUser.id },
        select: { officeId: true },
      });

      if (!managerStaff?.officeId) {
        return NextResponse.json(
          {
            success: false,
            error: "Manager must be assigned to an office",
          },
          { status: 403 }
        );
      }

      // Check if the user being edited belongs to the manager's office
      const userToEdit = await prisma.user.findUnique({
        where: { id },
        include: {
          role: { select: { name: true } },
          staffs: { select: { officeId: true } },
        },
      });

      if (!userToEdit) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      // Check if user belongs to manager's office
      const userOfficeId = userToEdit.staffs?.[0]?.officeId;
      if (userOfficeId !== managerStaff.officeId) {
        return NextResponse.json(
          {
            success: false,
            error: "Managers can only edit users in their own office",
          },
          { status: 403 }
        );
      }

      // Check if user being edited is a manager (managers cannot edit other managers)
      const userRoleName = userToEdit.role?.name?.toUpperCase() || "";
      if (
        userRoleName === "MANAGER" ||
        userRoleName === "OFFICE_MANAGER" ||
        userRoleName === "OFFICEMANAGER" ||
        userRoleName === "OFFICE MANAGER"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Managers cannot edit other manager users",
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

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

    // Check if trying to assign manager role (only admins can do this)
    if (data.roleId) {
      const role = await prisma.role.findUnique({
        where: { id: data.roleId },
        select: { name: true },
      });

      if (role) {
        const roleName = role.name.toUpperCase();
        if (
          roleName === "MANAGER" ||
          roleName === "OFFICE_MANAGER" ||
          roleName === "OFFICEMANAGER"
        ) {
          if (!isAdmin) {
            return NextResponse.json(
              {
                success: false,
                error: "Manager roles can only be assigned by administrators",
              },
              { status: 403 }
            );
          }
        }
      }
    }

    // Check if user exists
    const existingUser = await executeWithRetry(
      () => prisma.user.findUnique({ where: { id } }),
      2,
      10000
    );

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check for conflicts if phone, email, or username is being updated
    if (data.phoneNumber || data.email || data.username) {
      const normalizedPhone = data.phoneNumber
        ? normalizePhoneNumber(data.phoneNumber)
        : existingUser.phoneNumber;

      const conflicts = await executeWithRetry(
        () =>
          prisma.user.findFirst({
            where: {
              id: { not: id },
              OR: [
                ...(data.phoneNumber ? [{ phoneNumber: normalizedPhone }] : []),
                ...(data.email && data.email.trim() !== ""
                  ? [{ email: data.email }]
                  : []),
                ...(data.username && data.username.trim() !== ""
                  ? [{ username: data.username }]
                  : []),
              ],
            },
          }),
        2,
        10000
      );

      if (conflicts) {
        return NextResponse.json(
          {
            success: false,
            error:
              "User with this phone number, email, or username already exists",
          },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.phoneNumber) {
      updateData.phoneNumber = normalizePhoneNumber(data.phoneNumber);
    }
    if (data.email !== undefined) {
      updateData.email =
        data.email && data.email.trim() !== "" ? data.email : null;
    }
    if (data.username !== undefined) {
      updateData.username =
        data.username && data.username.trim() !== "" ? data.username : null;
      updateData.displayUsername =
        data.username && data.username.trim() !== "" ? data.username : null;
    }
    if (data.roleId) updateData.roleId = data.roleId;

    // Update password if provided
    if (data.password && data.password.trim() !== "") {
      const hashedPassword = await hash(data.password, 12);
      await executeWithRetry(
        () =>
          prisma.account.updateMany({
            where: {
              userId: id,
              providerId: "credential",
            },
            data: {
              password: hashedPassword,
            },
          }),
        2,
        10000
      );
    }

    // Update user
    const user = await executeWithRetry(
      () =>
        prisma.user.update({
          where: { id },
          data: updateData,
        }),
      2,
      10000
    );

    // Update staff relation if officeId is provided
    if (data.officeId !== undefined) {
      // Delete existing staff relations
      await executeWithRetry(
        () => prisma.staff.deleteMany({ where: { userId: id } }),
        2,
        10000
      );

      // Create new staff relation if officeId is provided
      if (data.officeId && data.officeId.trim() !== "") {
        await executeWithRetry(
          () =>
            prisma.staff.create({
              data: {
                userId: id,
                officeId: data.officeId!,
              },
            }),
          2,
          10000
        );
      }
    }

    // Fetch updated user with relations
    const updatedUser = await executeWithRetry(
      () =>
        prisma.user.findUnique({
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
        }),
      2,
      10000
    );

    if (!updatedUser) {
      throw new Error("Failed to fetch updated user");
    }

    const staff = updatedUser.staffs?.[0];
    const transformedUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      phoneNumberVerified: updatedUser.phoneNumberVerified,
      emailVerified: updatedUser.emailVerified,
      image: updatedUser.image,
      username: updatedUser.username,
      displayUsername: updatedUser.displayUsername,
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

// DELETE - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle params as Promise or object
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get authenticated user
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is manager
    const isManager =
      authUser.role?.name?.toLowerCase() === "manager" ||
      authUser.role?.name?.toLowerCase() === "office_manager";
    const isAdmin =
      authUser.role?.name?.toLowerCase() === "admin" ||
      authUser.role?.name?.toLowerCase() === "administrator";

    // If manager, check if they can delete this user
    if (isManager && !isAdmin) {
      // Get manager's office ID
      const managerStaff = await prisma.staff.findFirst({
        where: { userId: authUser.id },
        select: { officeId: true },
      });

      if (!managerStaff?.officeId) {
        return NextResponse.json(
          {
            success: false,
            error: "Manager must be assigned to an office",
          },
          { status: 403 }
        );
      }

      // Check if the user being deleted belongs to the manager's office
      const userToDelete = await prisma.user.findUnique({
        where: { id },
        include: {
          role: { select: { name: true } },
          staffs: { select: { officeId: true } },
        },
      });

      if (!userToDelete) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      // Check if user belongs to manager's office
      const userOfficeId = userToDelete.staffs?.[0]?.officeId;
      if (userOfficeId !== managerStaff.officeId) {
        return NextResponse.json(
          {
            success: false,
            error: "Managers can only delete users in their own office",
          },
          { status: 403 }
        );
      }

      // Check if user being deleted is a manager (managers cannot delete other managers)
      const userRoleName = userToDelete.role?.name?.toUpperCase() || "";
      if (
        userRoleName === "MANAGER" ||
        userRoleName === "OFFICE_MANAGER" ||
        userRoleName === "OFFICEMANAGER" ||
        userRoleName === "OFFICE MANAGER"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Managers cannot delete other manager users",
          },
          { status: 403 }
        );
      }
    }

    console.log("🗑️ Deleting user:", id);

    // Check if user exists
    const user = await executeWithRetry(
      () => prisma.user.findUnique({ where: { id } }),
      2,
      10000
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Delete user (cascade will delete related records)
    await executeWithRetry(
      () => prisma.user.delete({ where: { id } }),
      2,
      10000
    );

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
