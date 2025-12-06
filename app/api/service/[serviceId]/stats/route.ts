import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";

/**
 * GET - Get service statistics (total apply, pending, approved, rejected)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> | { serviceId: string } }
) {
  try {
    // Handle params as Promise or object
    const resolvedParams = await Promise.resolve(params);
    const { serviceId } = resolvedParams;

    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the authenticated user's office ID
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

    // Verify service exists and belongs to user's office
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { officeId: true },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      );
    }

    if (service.officeId !== userStaff.officeId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Get request statistics
    const [
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      totalRequestsForOthers,
      pendingRequestsForOthers,
      approvedRequestsForOthers,
      rejectedRequestsForOthers,
    ] = await Promise.all([
      // Regular requests
      prisma.request.count({
        where: { serviceId },
      }),
      // Pending requests (not both approved and not both rejected)
      prisma.request.count({
        where: {
          serviceId,
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
      // Approved requests (both approved)
      prisma.request.count({
        where: {
          serviceId,
          statusbystaff: "approved",
          statusbyadmin: "approved",
        },
      }),
      // Rejected requests (both rejected)
      prisma.request.count({
        where: {
          serviceId,
          statusbystaff: "rejected",
          statusbyadmin: "rejected",
        },
      }),
      // Requests for others
      prisma.requestForOther.count({
        where: { serviceId },
      }),
      prisma.requestForOther.count({
        where: { serviceId, status: "pending" },
      }),
      prisma.requestForOther.count({
        where: { serviceId, status: "approved" },
      }),
      prisma.requestForOther.count({
        where: { serviceId, status: "rejected" },
      }),
    ]);

    // Combine statistics
    const stats = {
      totalApply: totalRequests + totalRequestsForOthers,
      totalPending: pendingRequests + pendingRequestsForOthers,
      totalApproved: approvedRequests + approvedRequestsForOthers,
      totalRejected: rejectedRequests + rejectedRequestsForOthers,
      breakdown: {
        regular: {
          total: totalRequests,
          pending: pendingRequests,
          approved: approvedRequests,
          rejected: rejectedRequests,
        },
        forOthers: {
          total: totalRequestsForOthers,
          pending: pendingRequestsForOthers,
          approved: approvedRequestsForOthers,
          rejected: rejectedRequestsForOthers,
        },
      },
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error("❌ Error fetching service statistics:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch service statistics",
      },
      { status: 500 }
    );
  }
}
