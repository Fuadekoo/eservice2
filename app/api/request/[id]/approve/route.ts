import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";

/**
 * POST - Approve request as manager
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

    // Check if user is manager
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    const isManager = dbUser?.role?.name?.toLowerCase() === "manager";

    if (!isManager) {
      return NextResponse.json(
        { success: false, error: "Only managers can approve requests" },
        { status: 403 }
      );
    }

    // Get manager's staff record to get officeId
    const managerStaff = await prisma.staff.findFirst({
      where: { userId: session.user.id },
      select: { id: true, officeId: true },
    });

    if (!managerStaff) {
      return NextResponse.json(
        { success: false, error: "Manager staff record not found" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { note } = body;

    // Get the request and verify it belongs to manager's office
    const requestData = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        service: {
          select: {
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

    // Verify request belongs to manager's office
    if (requestData.service.officeId !== managerStaff.officeId) {
      return NextResponse.json(
        { success: false, error: "Request does not belong to your office" },
        { status: 403 }
      );
    }

    // Check if already approved by manager
    if (requestData.approveManagerId) {
      return NextResponse.json(
        { success: false, error: "Request already approved by manager" },
        { status: 400 }
      );
    }

    // Update the request with manager approval
    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: {
        approveManagerId: managerStaff.id,
        approveNote: note || null,
      },
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

