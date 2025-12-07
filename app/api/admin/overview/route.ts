import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";

// GET - Fetch admin dashboard overview statistics
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

    // Get statistics in parallel
    const [
      totalUsers,
      pendingApplications,
      scheduledAppointments,
      previousMonthUsers,
      currentMonthUsers,
      recentApplications,
    ] = await Promise.all([
      // Total Users
      prisma.user.count({
        where: {
          isActive: true,
        },
      }),
      // Pending Applications (requests that are not fully approved or rejected)
      prisma.request.count({
        where: {
          NOT: {
            OR: [
              {
                statusbystaff: "approved",
                statusbyadmin: "approved",
              },
              {
                statusbystaff: "rejected",
                statusbyadmin: "rejected",
              },
            ],
          },
        },
      }),
      // Scheduled Appointments (pending or approved)
      prisma.appointment.count({
        where: {
          status: {
            in: ["pending", "approved"],
          },
        },
      }),
      // Previous month users count (for growth calculation)
      prisma.user.count({
        where: {
          isActive: true,
          createdAt: {
            lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      // Current month users count
      prisma.user.count({
        where: {
          isActive: true,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      // Recent Applications (last 10)
      prisma.request.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              phoneNumber: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    // Calculate system growth percentage
    const systemGrowth =
      previousMonthUsers > 0
        ? Math.round(
            ((currentMonthUsers - previousMonthUsers) / previousMonthUsers) *
              100
          )
        : currentMonthUsers > 0
        ? 100
        : 0;

    // Format recent applications
    const formattedApplications = recentApplications.map((app) => ({
      id: app.id,
      applicant: app.user.username,
      service: app.service.name,
      date: app.date.toISOString(),
      status: getRequestStatus(app.statusbystaff, app.statusbyadmin),
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        pendingApplications,
        scheduledAppointments,
        systemGrowth,
        recentApplications: formattedApplications,
      },
    });
  } catch (error: any) {
    console.error("Error fetching admin overview:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch admin overview",
      },
      { status: 500 }
    );
  }
}

// Helper function to determine request status
function getRequestStatus(
  statusByStaff: string,
  statusByAdmin: string
): string {
  if (statusByStaff === "approved" && statusByAdmin === "approved") {
    return "Approved";
  }
  if (statusByStaff === "rejected" || statusByAdmin === "rejected") {
    return "Rejected";
  }
  if (statusByStaff === "pending" && statusByAdmin === "pending") {
    return "Pending";
  }
  return "Processing";
}
