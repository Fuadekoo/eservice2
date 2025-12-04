import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET - Fetch detailed statistics for an office
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

    console.log("📊 Fetching statistics for office:", officeId);

    // Get all statistics in parallel
    const [
      totalServices,
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      totalAppointments,
      pendingAppointments,
      approvedAppointments,
      rejectedAppointments,
      totalUsers,
      roles,
    ] = await Promise.all([
      // Total services
      prisma.service.count({
        where: {
          officeId: officeId,
        },
      }),
      // Total requests (through services)
      prisma.request.count({
        where: {
          service: {
            officeId: officeId,
          },
        },
      }),
      // Pending requests
      prisma.request.count({
        where: {
          service: {
            officeId: officeId,
          },
          status: "pending",
        },
      }),
      // Approved requests
      prisma.request.count({
        where: {
          service: {
            officeId: officeId,
          },
          status: "approved",
        },
      }),
      // Rejected requests
      prisma.request.count({
        where: {
          service: {
            officeId: officeId,
          },
          status: "rejected",
        },
      }),
      // Total appointments (through staff)
      prisma.appointment.count({
        where: {
          approveStaff: {
            officeId: officeId,
          },
        },
      }),
      // Pending appointments
      prisma.appointment.count({
        where: {
          approveStaff: {
            officeId: officeId,
          },
          status: "pending",
        },
      }),
      // Approved appointments
      prisma.appointment.count({
        where: {
          approveStaff: {
            officeId: officeId,
          },
          status: "approved",
        },
      }),
      // Rejected appointments
      prisma.appointment.count({
        where: {
          approveStaff: {
            officeId: officeId,
          },
          status: "rejected",
        },
      }),
      // Total users (through staff - unique count)
      (async () => {
        const staffMembers = await prisma.staff.findMany({
          where: {
            officeId: officeId,
          },
          select: {
            userId: true,
          },
        });
        const uniqueUserIds = new Set(
          staffMembers.map((staff) => staff.userId)
        );
        return uniqueUserIds.size;
      })(),
      // Roles for this office
      prisma.role.findMany({
        where: {
          officeId: officeId,
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
    ]);

    const stats = {
      totalServices,
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      totalAppointments,
      pendingAppointments,
      approvedAppointments,
      rejectedAppointments,
      totalUsers,
      roles: roles.map((role) => ({ id: role.id, name: role.name })),
    };

    console.log("✅ Statistics fetched:", stats);

    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    console.error("❌ Error fetching office statistics:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch office statistics",
      },
      { status: 500 }
    );
  }
}
