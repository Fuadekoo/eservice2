import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { canStaffApproveService } from "@/lib/service-staff-assignment";

/**
 * POST - Approve request as staff
 */
export async function POST(
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
      return NextResponse.json(
        { success: false, error: "Only staff can approve requests" },
        { status: 403 }
      );
    }

    // Get staff's staff record
    const staffRecord = await prisma.staff.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!staffRecord) {
      return NextResponse.json(
        { success: false, error: "Staff record not found" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { note, action = "approve" } = body; // action: "approve" or "reject", defaults to "approve"

    // Get the request with current approval status
    const requestData = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        service: {
          select: {
            id: true,
            officeId: true,
          },
        },
      },
    });

    if (!requestData) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 }
      );
    }

    // Verify staff can approve this service
    const canApprove = await canStaffApproveService(
      staffRecord.id,
      requestData.serviceId
    );

    if (!canApprove) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not assigned to this service or cannot approve it",
        },
        { status: 403 }
      );
    }

    // Check if already processed by staff
    if (requestData.approveStaffId) {
      return NextResponse.json(
        { success: false, error: "Request already processed by staff" },
        { status: 400 }
      );
    }

    // Determine new status based on both staff and manager actions
    let newStatus: "pending" | "approved" | "rejected" = requestData.status;
    const hasManagerApproved = !!requestData.approveManagerId;
    const hasManagerRejected = requestData.status === "rejected" && !hasManagerApproved;
    
    if (action === "approve") {
      // Staff approves: set approveStaffId
      // If manager has also approved, set status to "approved"
      if (hasManagerApproved) {
        newStatus = "approved";
      } else {
        // Manager hasn't approved yet, keep status as "pending"
        newStatus = "pending";
      }
    } else if (action === "reject") {
      // Staff rejects: don't set approveStaffId (it stays null)
      if (hasManagerApproved) {
        // Manager has approved but staff rejects - conflict, set to "pending"
        newStatus = "pending";
      } else if (hasManagerRejected) {
        // Manager has also rejected, both rejected → "rejected"
        newStatus = "rejected";
      } else {
        // Manager hasn't acted yet, set status to "rejected" (will be updated when manager acts)
        newStatus = "rejected";
      }
    }

    // Update the request with staff approval/rejection
    const updateData: any = {
      approveNote: note || null,
      status: newStatus,
    };

    // Only set approveStaffId if approving
    if (action === "approve") {
      updateData.approveStaffId = staffRecord.id;
    }

    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            phoneNumber: true,
          },
        },
        service: {
          include: {
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
        },
        approveStaff: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                phoneNumber: true,
              },
            },
          },
        },
        approveManager: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                phoneNumber: true,
              },
            },
          },
        },
        fileData: true,
        appointments: true,
      },
    });

    // Serialize dates
    const serializedRequest = {
      ...updatedRequest,
      date: updatedRequest.date.toISOString(),
      createdAt: updatedRequest.createdAt.toISOString(),
      updatedAt: updatedRequest.updatedAt.toISOString(),
      fileData: updatedRequest.fileData.map((file) => ({
        ...file,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
      })),
      appointments: updatedRequest.appointments.map((apt) => ({
        ...apt,
        date: apt.date.toISOString(),
        createdAt: apt.createdAt.toISOString(),
        updatedAt: apt.updatedAt.toISOString(),
      })),
    };

    return NextResponse.json({
      success: true,
      data: serializedRequest,
    });
  } catch (error: any) {
    console.error("❌ Error approving request:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to approve request",
      },
      { status: 500 }
    );
  }
}

