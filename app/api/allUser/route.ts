import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { userSchema } from "@/app/[lang]/dashboard/@admin/userManagement/_schema";
import { normalizePhoneNumber } from "@/lib/utils/phone-number";
import bcryptjs from "bcryptjs";
import { randomUUID } from "crypto";

// GET - Fetch all users with their roles and offices (admin only, with pagination and search)
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const skip = (page - 1) * pageSize;

    console.log("📥 Fetching users from database...", {
      search: search || "none",
      page,
      pageSize,
    });

    // Build where clause
    const where: any = {};

    // Add search if provided
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { username: { contains: searchTerm, mode: "insensitive" } },
        { phoneNumber: { contains: searchTerm, mode: "insensitive" } },
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
      ];
    }

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    // Fetch users with pagination
    const users = await prisma.user.findMany({
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

    console.log(
      `✅ Successfully fetched ${users.length} users (page ${page} of ${Math.ceil(total / pageSize)})`
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

// POST - Create a new user (admin only)
export async function POST(request: NextRequest) {
  try {
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
        OR: [
          { phoneNumber: normalizedPhone },
          { username: username },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error:
            "User with this phone number or username already exists",
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(data.password, 12);

    // Create user (adapt to actual schema - no name, email, image fields)
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        username: username,
        phoneNumber: normalizedPhone,
        password: hashedPassword,
        roleId: data.roleId || null,
        isActive: true,
        phoneVerified: false,
      },
    });

    // Create staff relation if officeId is provided
    if (data.officeId && data.officeId.trim() !== "") {
      await prisma.staff.create({
        data: {
          userId: user.id,
          officeId: data.officeId,
        },
      });
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
