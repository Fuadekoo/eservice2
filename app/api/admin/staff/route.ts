import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";

/**
 * GET - Fetch all staff from admin's assigned office
 * This endpoint is specifically for admins to fetch staff for service assignment
 * Returns ALL users (staff, managers, and admins) who have staff records in the office
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

    // Get admin's assigned office from staff relation
    const adminStaff = await prisma.staff.findFirst({
      where: { userId: userId },
      include: {
        office: true,
      },
    });

    if (!adminStaff) {
      return NextResponse.json(
        {
          success: false,
          error: "No office assigned. Please assign an office first.",
        },
        { status: 403 }
      );
    }

    const officeId = adminStaff.officeId;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "100", 10);
    const skip = (page - 1) * pageSize;

    console.log("📋 Admin fetching staff:", {
      officeId,
      officeName: adminStaff.office.name,
      search,
      page,
      pageSize,
      adminId: userId,
    });

    // Build where clause - filter by admin's office
    const where: any = {
      officeId: officeId,
      office: {
        status: true, // Only active offices
      },
    };

    // Note: MySQL doesn't support mode: "insensitive" in Prisma
    // For search, we'll fetch all staff and filter case-insensitively in application layer
    let allStaffForSearch: any[] = [];
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();

      // Fetch all staff from this office for case-insensitive filtering
      allStaffForSearch = await prisma.staff.findMany({
        where: {
          officeId: officeId,
          office: {
            status: true,
          },
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

      // Filter case-insensitively in application layer
      const filteredStaffIds = allStaffForSearch
        .filter((staff) => {
          const usernameMatch = staff.user?.username
            ?.toLowerCase()
            .includes(searchTerm);
          const phoneMatch = staff.user?.phoneNumber
            ?.toLowerCase()
            .includes(searchTerm);
          const roleMatch = staff.user?.role?.name
            ?.toLowerCase()
            .includes(searchTerm);
          return usernameMatch || phoneMatch || roleMatch;
        })
        .map((staff) => staff.id);

      if (filteredStaffIds.length > 0) {
        where.id = { in: filteredStaffIds };
      } else {
        // No matches, return empty result
        where.id = { in: [] };
      }
    }

    // Get total count for pagination
    let total: number;
    if (search && search.trim() && where.id?.in) {
      total = where.id.in.length;
    } else {
      total = await prisma.staff.count({ where });
    }

    // Fetch staff with pagination
    let staffList: any[];
    if (search && search.trim() && allStaffForSearch.length > 0) {
      // Use pre-filtered results and apply pagination
      const filteredStaff = allStaffForSearch
        .filter((staff) => {
          if (where.id?.in) {
            return where.id.in.includes(staff.id);
          }
          return true;
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(skip, skip + pageSize);

      staffList = filteredStaff;
    } else {
      // Normal fetch without search - get ALL staff from the office
      staffList = await prisma.staff.findMany({
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
    }

    // Format response - return ALL staff from the office (staff, managers, and admins)
    // Include the role name in the response for filtering in the UI
    const formattedStaff = staffList.map((staff: any) => ({
      id: staff.id,
      userId: staff.userId,
      username: staff.user.username,
      phoneNumber: staff.user.phoneNumber,
      isActive: staff.user.isActive,
      role: staff.user.role,
      roleName: staff.user.role?.name || "Unknown",
      officeId: staff.officeId,
      office: staff.office,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
    }));

    const totalPages = Math.ceil(total / pageSize);

    console.log(
      `✅ Admin fetched ${formattedStaff.length} staff from office "${adminStaff.office.name}" (page ${page} of ${totalPages})`
    );

    // If no staff found, provide helpful message
    if (formattedStaff.length === 0) {
      console.warn(
        `⚠️ No staff found in office "${adminStaff.office.name}" (ID: ${officeId})`
      );
    }

    return NextResponse.json({
      success: true,
      data: formattedStaff,
      total: formattedStaff.length,
      page,
      pageSize,
      totalPages,
      office: {
        id: adminStaff.office.id,
        name: adminStaff.office.name,
      },
      message:
        formattedStaff.length === 0
          ? `No staff members found in "${adminStaff.office.name}". Please add staff to this office first.`
          : undefined,
    });
  } catch (error: any) {
    console.error("❌ Error fetching admin staff:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch staff",
      },
      { status: 500 }
    );
  }
}
