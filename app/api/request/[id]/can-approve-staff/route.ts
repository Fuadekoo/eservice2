import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { canStaffApproveService } from "@/lib/service-staff-assignment";

/**
 * GET - Check if staff can approve a request
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const requestId = resolvedParams.id;

    // Check if user is staff
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    const isStaff = dbUser?.role?.name?.toLowerCase() === "staff";

    if (!isStaff) {
      return NextResponse.json({
        success: true,
        canApprove: false,
      });
    }

    // Get staff's staff record
    const staffRecord = await prisma.staff.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!staffRecord) {
      return NextResponse.json({
        success: true,
        canApprove: false,
      });
    }

    // Get the request
    const requestData = await prisma.request.findUnique({
      where: { id: requestId },
      select: {
        serviceId: true,
        approveStaffId: true,
        status: true,
      },
    });

    if (!requestData) {
      return NextResponse.json({
        success: true,
        canApprove: false,
      });
    }

    // Check if already approved by staff
    if (requestData.approveStaffId) {
      return NextResponse.json({
        success: true,
        canApprove: false,
      });
    }

    // Check if request is pending
    if (requestData.status !== "pending") {
      return NextResponse.json({
        success: true,
        canApprove: false,
      });
    }

    // Verify staff can approve this service
    const canApprove = await canStaffApproveService(
      staffRecord.id,
      requestData.serviceId
    );

    return NextResponse.json({
      success: true,
      canApprove,
    });
  } catch (error: any) {
    console.error("❌ Error checking approval permission:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to check approval permission",
      },
      { status: 500 }
    );
  }
}

