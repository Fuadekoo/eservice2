import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { randomUUID } from "crypto";
import { normalizePhoneNumber } from "@/lib/utils/phone-number";
import bcryptjs from "bcryptjs";

// GET - Fetch all staff for manager's office (with pagination and search)
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
        { success: false, error: "User office not found" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const skip = (page - 1) * pageSize;

    // Always use the authenticated user's office ID
    const officeId = userStaff.officeId;

    console.log("📋 Fetching staff:", {
      officeId,
      search,
      page,
      pageSize,
      userId: session.user.id,
    });

    // Build where clause - always filter by authenticated user's office
    const where: any = {
      officeId: officeId,
      office: {
        status: true, // Only active offices
      },
    };

    // Add fuzzy search if provided
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.AND = [
        {
          officeId: officeId,
          office: {
            status: true,
          },
        },
        {
          OR: [
            {
              user: {
                username: { contains: searchTerm, mode: "insensitive" },
              },
            },
            {
              user: {
                phoneNumber: { contains: searchTerm, mode: "insensitive" },
              },
            },
          ],
        },
      ];
      // Remove top-level filters since they're now in AND
      delete where.officeId;
      delete where.office;
    }

    // Get total count for pagination
    const total = await prisma.staff.count({ where });

    // Fetch staff with pagination
    const staffList = await prisma.staff.findMany({
      where,
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
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageSize,
    });

    // Format response
    const formattedStaff = staffList.map((staff: any) => ({
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
    }));

    const totalPages = Math.ceil(total / pageSize);

    console.log(
      `✅ Fetched ${formattedStaff.length} staff (page ${page} of ${totalPages})`
    );

    return NextResponse.json({
      success: true,
      data: formattedStaff,
      total,
      page,
      pageSize,
      totalPages,
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

// POST - Create a new staff member
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
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

    // Check if user is admin or manager
    const roleName = dbUser.role?.name?.toLowerCase() || "";
    const isAdmin = roleName === "admin" || roleName === "administrator";
    const isManager = roleName === "manager" || roleName === "office_manager";

    if (!isAdmin && !isManager) {
      return NextResponse.json(
        {
          success: false,
          error: "Only office managers and admins can create staff",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, officeId, username, phoneNumber, password, roleId } = body;

    // Get manager's office ID
    const managerStaff = await prisma.staff.findFirst({
      where: { userId: session.user.id },
      select: { officeId: true },
    });

    if (!managerStaff) {
      return NextResponse.json(
        { success: false, error: "Manager office not found" },
        { status: 403 }
      );
    }

    // Always use manager's office ID
    const finalOfficeId = managerStaff.officeId;

    // Verify office exists and is active
    const office = await prisma.office.findUnique({
      where: { id: finalOfficeId },
    });

    if (!office) {
      return NextResponse.json(
        { success: false, error: "Office not found" },
        { status: 404 }
      );
    }

    let finalUserId = userId;

    // If creating new user (username, phoneNumber, password provided)
    if (username && phoneNumber && password) {
      // Normalize phone number
      const normalizedPhone = normalizePhoneNumber(phoneNumber);

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

      // ALWAYS find and use "staff" role for new staff members (ignore provided roleId)
      // This ensures staff members can never be assigned manager or admin roles
      // First, try to find staff role for this office (case-insensitive search)
      const officeRoles = await prisma.role.findMany({
        where: {
          officeId: finalOfficeId,
        },
      });

      let staffRole = officeRoles.find(
        (role) => role.name.toLowerCase() === "staff"
      );

      // If not found for office, try to find a global staff role (no officeId)
      if (!staffRole) {
        const globalRoles = await prisma.role.findMany({
          where: {
            officeId: null,
          },
        });

        staffRole = globalRoles.find(
          (role) => role.name.toLowerCase() === "staff"
        );
      }

      // If still not found, automatically create a "staff" role for this office
      if (!staffRole) {
        console.log(
          `📝 Staff role not found for office ${finalOfficeId}. Creating it automatically...`
        );
        staffRole = await prisma.role.create({
          data: {
            name: "staff",
            officeId: finalOfficeId,
          },
        });
        console.log(
          `✅ Created staff role: ${staffRole.id} for office ${finalOfficeId}`
        );
      }

      // Validate that if a roleId was provided, it's actually the staff role
      if (roleId && roleId !== staffRole.id) {
        console.warn(
          `⚠️ Attempted to assign non-staff role (${roleId}) to new staff member. Using staff role (${staffRole.id}) instead.`
        );
      }

      const finalRoleId = staffRole.id;

      // Hash password
      const hashedPassword = await bcryptjs.hash(password, 12);

      // Create user with staff role (always)
      const newUser = await prisma.user.create({
        data: {
          id: randomUUID(),
          username: username,
          phoneNumber: normalizedPhone,
          password: hashedPassword,
          roleId: finalRoleId, // Always staff role
          isActive: true, // Default to active when account is created
        },
      });

      finalUserId = newUser.id;
    } else if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Either userId or user details (username, phoneNumber, password) are required",
        },
        { status: 400 }
      );
    }

    // Check if staff already exists for this user and office
    const existingStaff = await prisma.staff.findFirst({
      where: {
        userId: finalUserId,
        officeId: finalOfficeId,
      },
    });

    if (existingStaff) {
      return NextResponse.json(
        {
          success: false,
          error: "Staff already exists for this user and office",
        },
        { status: 400 }
      );
    }

    // Create staff
    const staff = await prisma.staff.create({
      data: {
        id: randomUUID(),
        userId: finalUserId,
        officeId: finalOfficeId,
      },
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

    console.log(`✅ Created staff: ${staff.id}`);

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
    console.error("❌ Error creating staff:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create staff",
      },
      { status: 500 }
    );
  }
}
