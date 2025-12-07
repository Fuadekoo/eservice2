import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";

// GET - Fetch manager dashboard overview statistics
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

    // Get the authenticated user's office ID from staff relation
    const userStaff = await prisma.staff.findFirst({
      where: { userId: userId },
      include: {
        office: {
          select: {
            id: true,
            name: true,
            logo: true,
            slogan: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!userStaff) {
      return NextResponse.json(
        { success: false, error: "Manager office not found" },
        { status: 403 }
      );
    }

    const officeId = userStaff.officeId;

    // Get statistics in parallel - filtered by office
    const [
      totalStaff,
      pendingRequests,
      scheduledAppointments,
      totalServices,
      recentRequests,
    ] = await Promise.all([
      // Total Staff in this office
      prisma.staff.count({
        where: {
          officeId: officeId,
        },
      }),
      // Pending Requests for services in this office
      prisma.request.count({
        where: {
          service: {
            officeId: officeId,
          },
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
      // Scheduled Appointments for requests in this office
      prisma.appointment.count({
        where: {
          request: {
            service: {
              officeId: officeId,
            },
          },
          status: {
            in: ["pending", "approved"],
          },
        },
      }),
      // Total Services in this office
      prisma.service.count({
        where: {
          officeId: officeId,
        },
      }),
      // Recent Requests (last 10) for services in this office
      prisma.request.findMany({
        take: 10,
        where: {
          service: {
            officeId: officeId,
          },
        },
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

    // Format recent requests
    const formattedRequests = recentRequests.map((req) => ({
      id: req.id,
      applicant: req.user.username,
      service: req.service.name,
      date: req.date.toISOString(),
      status: getRequestStatus(req.statusbystaff, req.statusbyadmin),
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalStaff,
        pendingRequests,
        scheduledAppointments,
        totalServices,
        recentRequests: formattedRequests,
        office: {
          id: userStaff.office.id,
          name: userStaff.office.name,
          logo: userStaff.office.logo,
          slogan: userStaff.office.slogan,
        },
        username: userStaff.user.username,
        role: userStaff.user.role?.name || "Manager",
      },
    });
  } catch (error: any) {
    console.error("Error fetching manager overview:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch manager overview",
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
