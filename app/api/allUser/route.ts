import { NextRequest, NextResponse } from "next/server";
import { prisma, executeWithRetry } from "@/lib/prisma";
import { userSchema } from "@/app/[domain]/manager/userManagement/_schema";
import { normalizePhoneNumber } from "@/lib/utils/phone-number";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import { getAuthenticatedUser } from "@/lib/api/api-permissions";

// GET - Fetch all users with their roles and offices (with pagination and office filtering)
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the authenticated user's office ID from staff relation
    const userStaff = await prisma.staff.findFirst({
      where: { userId: authUser.id },
      select: { officeId: true },
    });

    if (!userStaff) {
      return NextResponse.json(
        { success: false, error: "User office not found" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedOfficeId = searchParams.get("officeId");
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const skip = (page - 1) * pageSize;

    // Always use the authenticated user's office ID (ignore requested officeId for security)
    const officeId = userStaff.officeId;

    console.log("📥 Fetching users from database...", {
      officeId,
      requestedOfficeId,
      search,
      page,
      pageSize,
      userId: authUser.id,
    });

    // Build where clause - always filter by authenticated user's office
    const where: any = {
      staffs: {
        some: {
          officeId: officeId,
        },
      },
    };

    // Add fuzzy search if provided (combine with office filter)
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.AND = [
        {
          staffs: {
            some: {
              officeId: officeId,
            },
          },
        },
        {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { phoneNumber: { contains: searchTerm, mode: "insensitive" } },
            { username: { contains: searchTerm, mode: "insensitive" } },
            {
              role: {
                name: { contains: searchTerm, mode: "insensitive" },
              },
            },
            {
              staffs: {
                some: {
                  office: {
                    name: { contains: searchTerm, mode: "insensitive" },
                  },
                },
              },
            },
          ],
        },
      ];
      // Remove the top-level staffs filter since it's now in AND
      delete where.staffs;
    }

    // Get total count for pagination
    const total = await executeWithRetry(
      () => prisma.user.count({ where }),
      1,
      5000
    );

    // Fetch users with pagination
    const users = await executeWithRetry(
      () =>
        prisma.user.findMany({
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
        }),
      2,
      10000
    );

    console.log(
      `✅ Successfully fetched ${
        users.length
      } users (page ${page} of ${Math.ceil(total / pageSize)})`
    );

    // Transform users to include office from staff relation
    const transformedUsers = (users || []).map((user) => {
      const staff = user.staffs?.[0];
      return {
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

// POST - Create a new user
export async function POST(request: NextRequest) {
  try {
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
          roleName === "OFFICEMANAGER" ||
          roleName === "OFFICE MANAGER"
        ) {
          // Managers cannot assign manager roles
          if (isManager && !isAdmin) {
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

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(data.phoneNumber);

    // Check if user already exists
    const existingUser = await executeWithRetry(
      () =>
        prisma.user.findFirst({
          where: {
            OR: [
              { phoneNumber: normalizedPhone },
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

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error:
            "User with this phone number, email, or username already exists",
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(data.password, 12);

    // Generate unique email if not provided
    const email =
      data.email && data.email.trim() !== ""
        ? data.email
        : `${normalizedPhone.replace(/[^0-9]/g, "")}@eservice.local`;

    // Create user
    const user = await executeWithRetry(
      () =>
        prisma.user.create({
          data: {
            id: randomUUID(),
            name: data.name,
            phoneNumber: normalizedPhone,
            phoneNumberVerified: true,
            email: email,
            emailVerified: false,
            roleId: data.roleId,
            username:
              data.username && data.username.trim() !== ""
                ? data.username
                : null,
            displayUsername:
              data.username && data.username.trim() !== ""
                ? data.username
                : null,
          },
        }),
      2,
      10000
    );

    // Create account with password
    await executeWithRetry(
      () =>
        prisma.account.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            accountId: user.id,
            providerId: "credential",
            password: hashedPassword,
          },
        }),
      2,
      10000
    );

    // Create staff relation if officeId is provided
    if (data.officeId) {
      await executeWithRetry(
        () =>
          prisma.staff.create({
            data: {
              userId: user.id,
              officeId: data.officeId!,
            },
          }),
        2,
        10000
      );
    }

    // Fetch created user with relations
    const createdUser = await executeWithRetry(
      () =>
        prisma.user.findUnique({
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
        }),
      2,
      10000
    );

    if (!createdUser) {
      throw new Error("Failed to fetch created user");
    }

    // Transform user
    const staff = createdUser.staffs?.[0];
    const transformedUser = {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      phoneNumber: createdUser.phoneNumber,
      phoneNumberVerified: createdUser.phoneNumberVerified,
      emailVerified: createdUser.emailVerified,
      image: createdUser.image,
      username: createdUser.username,
      displayUsername: createdUser.displayUsername,
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
