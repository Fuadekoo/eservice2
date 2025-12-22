import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { auth } from "@/auth";
import bcryptjs from "bcryptjs";
import { randomUUID } from "crypto";
import { normalizePhoneNumber } from "@/lib/utils/phone-number";
import { sendSMS as sendSMSUtil } from "@/lib/utils/sms";

/**
 * Send SMS to user (wrapper that returns success/error object)
 */
async function sendSMS(to: string, message: string) {
  try {
    const result = await sendSMSUtil(to, message);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("❌ Failed to send SMS:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate random 8-digit password
 */
function generatePassword(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

/**
 * GET - Get the current manager for an office
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ officeId: string }> | { officeId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const officeId = resolvedParams.officeId;

    if (!officeId) {
      return NextResponse.json(
        { success: false, error: "Office ID is required" },
        { status: 400 }
      );
    }

    // Check permission
    const { response, userId } = await requirePermission(request, "office:read");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find manager role for this office (using lowercase to match seed data)
    const managerRole = await prisma.role.findFirst({
      where: {
        officeId: officeId,
        name: "manager",
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
    console.error("❌ Error fetching office manager:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch office manager",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Assign a manager to an office
 * Body: { userId?: string, createNew?: boolean, name?: string, phoneNumber?: string, email?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ officeId: string }> | { officeId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const officeId = resolvedParams.officeId;

    if (!officeId) {
      return NextResponse.json(
        { success: false, error: "Office ID is required" },
        { status: 400 }
      );
    }

    // Get authenticated user first
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user with role from database
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

    // Check if user is admin
    const isAdmin = dbUser.role?.name?.toLowerCase() === "admin";

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Only admins can assign office managers" },
        { status: 403 }
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

    const body = await request.json();
    const { userId, createNew, name, phoneNumber, email } = body;

    // If creating a new user
    if (createNew) {
      if (!name || !phoneNumber) {
        return NextResponse.json(
          { success: false, error: "Name and phone number are required" },
          { status: 400 }
        );
      }

      // Normalize phone number
      const normalizedPhone = normalizePhoneNumber(phoneNumber);

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          phoneNumber: normalizedPhone,
        },
      });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: "User with this phone number already exists",
          },
          { status: 400 }
        );
      }

      // Find or create manager role for this office
      let managerRole = await prisma.role.findFirst({
        where: {
          officeId: officeId,
          name: "manager",
        },
      });

      if (!managerRole) {
        managerRole = await prisma.role.create({
          data: {
            name: "manager",
            officeId: officeId,
          },
        });
      }

      // Generate random 8-digit password
      const password = generatePassword();
      const hashedPassword = await bcryptjs.hash(password, 12);

      // Generate username from phone number if name not provided
      const username =
        name && name.trim() !== ""
          ? name.toLowerCase().replace(/\s+/g, "_") +
            "_" +
            normalizedPhone.replace(/[^0-9]/g, "").slice(-4)
          : "manager_" + normalizedPhone.replace(/[^0-9]/g, "").slice(-8);

      // Create user (adapt to actual schema - no name, email, image fields)
      const newUser = await prisma.user.create({
        data: {
          id: randomUUID(),
          username: username,
          phoneNumber: normalizedPhone,
          password: hashedPassword,
          phoneVerified: true,
          roleId: managerRole.id,
          isActive: true,
        },
      });

      // Ensure user is also a staff member of this office
      const existingStaff = await prisma.staff.findFirst({
        where: {
          userId: newUser.id,
          officeId: officeId,
        },
      });

      if (!existingStaff) {
        await prisma.staff.create({
          data: {
            userId: newUser.id,
            officeId: officeId,
          },
        });
      }

      // Send SMS with password
      //   const smsMessage = `Welcome to East Shoa E-Service!\n\nYour account has been created as Office Manager.\n\nYour password is: ${password}\n\nPlease change your password after first login.\n\nThank you!`;
      const smsMessage = `Your password is: ${password}\n\nPlease change your password after first login.\n\nThank you!`;
      await sendSMS(normalizedPhone, smsMessage);

      // Fetch updated manager info
      const updatedManager = await prisma.user.findUnique({
        where: { id: newUser.id },
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

      return NextResponse.json({
        success: true,
        data: updatedManager,
        message:
          "Manager created and assigned successfully. Password sent via SMS.",
      });
    }

    // Assign existing user
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const userToAssign = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToAssign) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Find or create manager role for this office
    let managerRole = await prisma.role.findFirst({
      where: {
        officeId: officeId,
        name: "manager",
      },
    });

    if (!managerRole) {
      managerRole = await prisma.role.create({
        data: {
          name: "manager",
          officeId: officeId,
        },
      });
    }

    // Check if there's already a manager for this office
    const existingManager = await prisma.user.findFirst({
      where: {
        roleId: managerRole.id,
      },
    });

    // If there's an existing manager, we need to handle their role
    // Since roleId is required, we'll find a default role or keep them as manager
    // For now, we'll just update the new user - the old manager will keep their role
    // but the new user will be the active manager
    // TODO: Consider finding a default role to assign to the old manager

    // Assign manager role to the new user
    await prisma.user.update({
      where: { id: userId },
      data: { roleId: managerRole.id },
    });

    // Ensure user is also a staff member of this office
    const existingStaff = await prisma.staff.findFirst({
      where: {
        userId: userId,
        officeId: officeId,
      },
    });

    if (!existingStaff) {
      await prisma.staff.create({
        data: {
          userId: userId,
          officeId: officeId,
        },
      });
    }

    // Fetch updated manager info
    const updatedManager = await prisma.user.findUnique({
      where: { id: userId },
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

    return NextResponse.json({
      success: true,
      data: updatedManager,
      message: "Manager assigned successfully",
    });
  } catch (error: any) {
    console.error("❌ Error assigning office manager:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to assign office manager",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove manager from an office
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ officeId: string }> | { officeId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const officeId = resolvedParams.officeId;

    if (!officeId) {
      return NextResponse.json(
        { success: false, error: "Office ID is required" },
        { status: 400 }
      );
    }

    // Get authenticated user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user with role from database
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

    // Check if user is admin
    const isAdmin = dbUser.role?.name?.toLowerCase() === "admin";

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Only admins can remove office managers" },
        { status: 403 }
      );
    }

    // Find manager role for this office (using lowercase to match seed data)
    const managerRole = await prisma.role.findFirst({
      where: {
        officeId: officeId,
        name: "manager",
      },
    });

    if (!managerRole) {
      return NextResponse.json({
        success: true,
        message: "No manager role found for this office",
      });
    }

    // Find user with manager role
    const managerUser = await prisma.user.findFirst({
      where: {
        roleId: managerRole.id,
      },
    });

    if (managerUser) {
      // Find a default role to assign (e.g., staff role)
      // For now, we'll find any non-manager role or create a basic role
      const defaultRole = await prisma.role.findFirst({
        where: {
          name: {
            not: "manager",
          },
          officeId: null, // Global role
        },
      });

      if (defaultRole) {
        // Assign default role to old manager
        await prisma.user.update({
          where: { id: managerUser.id },
          data: { roleId: defaultRole.id },
        });
      }
      // If no default role found, the old manager keeps their manager role
      // This is acceptable as there can technically be multiple managers
    }

    return NextResponse.json({
      success: true,
      message: "Manager removed successfully",
    });
  } catch (error: any) {
    console.error("❌ Error removing office manager:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to remove office manager",
      },
      { status: 500 }
    );
  }
}
