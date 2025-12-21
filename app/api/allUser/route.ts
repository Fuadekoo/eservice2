import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { userSchema } from "@/app/[lang]/dashboard/@admin/userManagement/_schema";
import { normalizePhoneNumber } from "@/lib/utils/phone-number";
import bcryptjs from "bcryptjs";
import { randomUUID } from "crypto";

// GET - Fetch all users with their roles and offices (requires user:read permission)
export async function GET(request: NextRequest) {
  try {
    // Check permission
    const { response, userId } = await requirePermission(request, "user:read");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const roleId = searchParams.get("roleId") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const skip = (page - 1) * pageSize;

    console.log("📥 Fetching users from database...", {
      search: search || "none",
      roleId: roleId || "none",
      page,
      pageSize,
      userId,
    });

    // Build where clause
    // Note: MySQL doesn't support mode: "insensitive" in Prisma
    // We'll fetch all users and filter case-insensitively in the application layer
    let where: any = {};

    // Determine if we're filtering by role group or specific role ID
    const isRoleGroup =
      roleId &&
      roleId.trim() &&
      ["manager", "staff", "admin", "customer"].includes(
        roleId.trim().toLowerCase()
      );
    const roleGroupName = isRoleGroup ? roleId.trim().toLowerCase() : null;
    const specificRoleId =
      !isRoleGroup && roleId && roleId.trim() ? roleId.trim() : null;

    // Add specific role ID filter if provided (not a role group)
    if (specificRoleId) {
      where.roleId = specificRoleId;
    }

    // Fetch all users first if search is provided OR role group filter is used (for case-insensitive filtering)
    let allUsersForSearch: any[] = [];
    if ((search && search.trim()) || roleGroupName) {
      // Fetch all users with relations for case-insensitive filtering
      allUsersForSearch = await prisma.user.findMany({
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

      // Filter case-insensitively in application layer
      const filteredUserIds = allUsersForSearch
        .filter((user) => {
          // Apply role group filter if specified
          if (roleGroupName) {
            const userRoleName = user.role?.name?.toLowerCase() || "";
            // Match role name containing the group name (case-insensitive)
            // Examples: "manager" matches "manager", "MANAGER", "office_manager", "Manager", etc.
            // Normalize by removing underscores, spaces, and hyphens for better matching
            const normalizedRoleName = userRoleName.replace(/[_\s-]/g, "");
            const normalizedGroupName = roleGroupName.replace(/[_\s-]/g, "");

            // Check if normalized role name contains the normalized group name
            // This ensures "manager", "MANAGER", "office_manager" all match "manager" group
            if (!normalizedRoleName.includes(normalizedGroupName)) {
              return false;
            }
          }

          // Apply search filter if specified
          if (search && search.trim()) {
            const searchTerm = search.trim().toLowerCase();
            const usernameMatch = user.username
              ?.toLowerCase()
              .includes(searchTerm);
            const phoneMatch = user.phoneNumber
              ?.toLowerCase()
              .includes(searchTerm);
            const roleMatch = user.role?.name
              ?.toLowerCase()
              .includes(searchTerm);
            const officeMatch = user.staffs?.some((staff: any) =>
              staff.office?.name?.toLowerCase().includes(searchTerm)
            );
            if (!(usernameMatch || phoneMatch || roleMatch || officeMatch)) {
              return false;
            }
          }

          return true;
        })
        .map((user) => user.id);

      if (filteredUserIds.length > 0) {
        where.id = { in: filteredUserIds };
      } else {
        // No matches, return empty result
        where.id = { in: [] };
      }
    }

    // Get total count for pagination
    let total: number;
    if (((search && search.trim()) || roleGroupName) && where.id?.in) {
      // Use the count of filtered IDs
      total = where.id.in.length;
    } else if (specificRoleId) {
      // Count users with specific role ID
      total = await prisma.user.count({ where });
    } else {
      // No search or empty search - count all users
      total = await prisma.user.count();
    }

    // Fetch users with pagination
    let users;
    if (
      ((search && search.trim()) || roleGroupName) &&
      allUsersForSearch.length > 0
    ) {
      // Use pre-filtered results and apply pagination
      const filteredUsers = allUsersForSearch
        .filter((user) => {
          if (where.id?.in) {
            return where.id.in.includes(user.id);
          }
          return true;
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(skip, skip + pageSize);

      users = filteredUsers;
    } else {
      // Normal fetch without search
      users = await prisma.user.findMany({
        where,
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
            take: 1, // Get the first staff assignment if any
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      });
    }

    console.log(
      `✅ Successfully fetched ${
        users.length
      } users (page ${page} of ${Math.ceil(total / pageSize)})`
    );

    // Transform users to match frontend expectations
    const transformedUsers = users.map((user) => {
      const staff = user.staffs?.[0];
      return {
        id: user.id,
        name: user.username, // Use username as name since schema doesn't have name field
        email: null, // Schema doesn't have email field
        phoneNumber: user.phoneNumber,
        phoneNumberVerified: user.phoneVerified,
        emailVerified: false, // Schema doesn't have emailVerified field
        image: null, // Schema doesn't have image field
        username: user.username,
        displayUsername: user.username, // Use username as displayUsername
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
    });

    return NextResponse.json({
      success: true,
      data: transformedUsers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    console.error("❌ Error fetching users:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch users",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// POST - Create a new user (requires user:create permission)
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const { response, userId } = await requirePermission(request, "user:create");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("📤 Creating user:", { ...body, password: "***" });

    // Validate input
    const validationResult = userSchema.safeParse(body);
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

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(data.phoneNumber);

    // Generate username if not provided (use name or phone number)
    const username =
      data.username && data.username.trim() !== ""
        ? data.username.trim()
        : data.name
        ? data.name.toLowerCase().replace(/\s+/g, "_") +
          "_" +
          normalizedPhone.replace(/[^0-9]/g, "").slice(-4)
        : "user_" + normalizedPhone.replace(/[^0-9]/g, "").slice(-8);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ phoneNumber: normalizedPhone }, { username: username }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User with this phone number or username already exists",
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(data.password, 12);

    // Validate roleId is provided (schema should catch this, but double-check)
    if (!data.roleId || data.roleId.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Role is required",
        },
        { status: 400 }
      );
    }

    // Get the selected role to check if it's a manager role
    const selectedRole = await prisma.role.findUnique({
      where: { id: data.roleId.trim() },
    });

    if (!selectedRole) {
      return NextResponse.json(
        {
          success: false,
          error: "Selected role not found",
        },
        { status: 400 }
      );
    }

    const isManagerOrStaffRole =
      selectedRole.name.toLowerCase() === "manager" ||
      selectedRole.name.toLowerCase() === "office_manager" ||
      selectedRole.name.toLowerCase() === "staff";

    // If creating a manager or staff, ensure officeId is provided
    if (
      isManagerOrStaffRole &&
      (!data.officeId || data.officeId.trim() === "")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Office is required when creating a manager or staff",
        },
        { status: 400 }
      );
    }

    // If creating a manager or staff, ensure role exists for the office
    let finalRoleId = data.roleId.trim();
    if (isManagerOrStaffRole && data.officeId && data.officeId.trim() !== "") {
      // Check if the selected role already exists for this office
      const existingRole = await prisma.role.findFirst({
        where: {
          id: data.roleId.trim(),
          officeId: data.officeId.trim(),
        },
      });

      if (existingRole) {
        // Role already exists for this office, use it
        finalRoleId = existingRole.id;
      } else {
        // Check if it's a manager role - if so, find or create manager role for this office
        const isManagerRole =
          selectedRole.name.toLowerCase() === "manager" ||
          selectedRole.name.toLowerCase() === "office_manager";

        if (isManagerRole) {
          let managerRole = await prisma.role.findFirst({
            where: {
              officeId: data.officeId.trim(),
              OR: [
                { name: "manager" },
                { name: "office_manager" },
                { name: "Manager" },
                { name: "Office_Manager" },
              ],
            },
          });

          if (!managerRole) {
            managerRole = await prisma.role.create({
              data: {
                name: "manager",
                officeId: data.officeId.trim(),
              },
            });
            console.log("✅ Created manager role for office:", data.officeId);
          }

          finalRoleId = managerRole.id;
        } else {
          // For staff role, use the selected role ID (it should exist)
          finalRoleId = data.roleId.trim();
        }
      }
    }

    // Create user (adapt to actual schema - no name, email, image fields)
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        username: username,
        phoneNumber: normalizedPhone,
        password: hashedPassword,
        roleId: finalRoleId,
        isActive: true,
        phoneVerified: false,
      },
    });

    // Create staff relation if officeId is provided (required for managers)
    if (data.officeId && data.officeId.trim() !== "") {
      // Check if staff relation already exists
      const existingStaff = await prisma.staff.findFirst({
        where: {
          userId: user.id,
          officeId: data.officeId.trim(),
        },
      });

      if (!existingStaff) {
        await prisma.staff.create({
          data: {
            userId: user.id,
            officeId: data.officeId.trim(),
          },
        });
        console.log("✅ Created staff relation for user:", user.id);
      }
    }

    // Fetch created user with relations
    const createdUser = await prisma.user.findUnique({
      where: { id: user.id },
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

    if (!createdUser) {
      throw new Error("Failed to fetch created user");
    }

    // Transform user
    const staff = createdUser.staffs?.[0];
    const transformedUser = {
      id: createdUser.id,
      name: createdUser.username,
      email: null,
      phoneNumber: createdUser.phoneNumber,
      phoneNumberVerified: createdUser.phoneVerified,
      emailVerified: false,
      image: null,
      username: createdUser.username,
      displayUsername: createdUser.username,
      roleId: createdUser.roleId,
      role: createdUser.role
        ? {
            id: createdUser.role.id,
            name: createdUser.role.name,
            officeId: createdUser.role.officeId,
            office: createdUser.role.office,
          }
        : null,
      officeId: staff?.officeId || null,
      office: staff?.office || null,
      createdAt: createdUser.createdAt.toISOString(),
      updatedAt: createdUser.updatedAt.toISOString(),
    };

    console.log("✅ User created successfully:", transformedUser.id);

    return NextResponse.json(
      { success: true, data: transformedUser },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Error creating user:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create user",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
