import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";

// GET - Fetch reports sent TO the authenticated admin
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
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const officeId = searchParams.get("officeId") || "";
    const skip = (page - 1) * pageSize;

    // Build where clause - only reports sent TO this admin (received reports)
    const whereConditions: any[] = [
      {
        reportSentTo: session.user.id,
      },
    ];

    // Add office filter - filter by sender's office
    if (officeId && officeId !== "all") {
      // Get all staff members in this office with their user and role information
      const staffInOffice = await prisma.staff.findMany({
        where: {
          officeId: officeId,
        },
        include: {
          user: {
            select: {
              id: true,
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      // Filter for managers only (case-insensitive check)
      const managerUserIds = staffInOffice
        .filter((staff) => {
          const roleName = staff.user?.role?.name?.toLowerCase();
          return roleName === "manager";
        })
        .map((staff) => staff.userId);

      if (managerUserIds.length > 0) {
        whereConditions.push({
          reportSentBy: {
            in: managerUserIds,
          },
        });
      } else {
        // No managers in this office, return empty result by using a condition that will never match
        whereConditions.push({
          reportSentBy: {
            in: [],
          },
        });
      }
    }

    // Add search filter
    if (search && search.trim()) {
      const searchConditions = [
        { name: { contains: search } },
        { description: { contains: search } },
        {
          reportSentByUser: {
            username: { contains: search },
          },
        },
        {
          reportSentByUser: {
            phoneNumber: { contains: search },
          },
        },
      ];
      whereConditions.push({ OR: searchConditions });
    }

    // Add status filter
    if (status && status !== "all") {
      whereConditions.push({
        receiverStatus: status,
      });
    }

    // Combine all conditions with AND
    const where: any =
      whereConditions.length > 1
        ? { AND: whereConditions }
        : whereConditions[0];

    // Get total count
    const total = await prisma.report.count({ where });

    // Fetch reports
    const reports = await prisma.report.findMany({
      where,
      include: {
        fileData: {
          select: {
            id: true,
            name: true,
            filepath: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        reportSentToUser: {
          select: {
            id: true,
            username: true,
            phoneNumber: true,
          },
        },
        reportSentByUser: {
          include: {
            staffs: {
              include: {
                office: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    });

    // Serialize dates and include office information
    const serializedReports = reports.map((report) => ({
      ...report,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      fileData: report.fileData.map((file) => ({
        ...file,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
      })),
      reportSentByUser: report.reportSentByUser
        ? {
            id: report.reportSentByUser.id,
            username: report.reportSentByUser.username,
            phoneNumber: report.reportSentByUser.phoneNumber,
            office: report.reportSentByUser.staffs?.[0]?.office || null,
          }
        : null,
    }));

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: serializedReports,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching reports:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch reports",
      },
      { status: 500 }
    );
  }
}
