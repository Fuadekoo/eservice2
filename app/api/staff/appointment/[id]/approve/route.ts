import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { canStaffApproveService } from "@/lib/service-staff-assignment";

// PATCH - Approve or reject an appointment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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
    const resolvedParams = await Promise.resolve(params);
    const appointmentId = resolvedParams.id;

    // Get user role
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    const isStaff = dbUser?.role?.name?.toLowerCase() === "staff";

    if (!isStaff) {
      return NextResponse.json(
        { success: false, error: "Only staff can approve appointments" },
        { status: 403 }
      );
    }

    // Get staff record
    const staffRecord = await prisma.staff.findFirst({
      where: { userId: userId },
      select: { id: true },
    });

    if (!staffRecord) {
      return NextResponse.json(
        { success: false, error: "Staff record not found" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action = "approve", notes } = body; // action: "approve" or "reject"

    // Get the appointment with request and service
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        request: {
          select: {
            id: true,
            serviceId: true,
            service: {
              select: {
                id: true,
                officeId: true,
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Verify staff can approve this service
    const canApprove = await canStaffApproveService(
      staffRecord.id,
      appointment.request.serviceId
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

    // Determine new status
    const newStatus = action === "approve" ? "approved" : "rejected";

    // Update the appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: newStatus,
        notes: notes || appointment.notes,
        staffId: staffRecord.id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            phoneNumber: true,
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
        request: {
          select: {
            id: true,
            date: true,
            statusbystaff: true,
            statusbyadmin: true,
            service: {
              select: {
                id: true,
                name: true,
                description: true,
                office: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    roomNumber: true,
                  },
                },
              },
            },
            user: {
              select: {
                id: true,
                username: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedAppointment,
        date: updatedAppointment.date.toISOString(),
        createdAt: updatedAppointment.createdAt.toISOString(),
        updatedAt: updatedAppointment.updatedAt.toISOString(),
        request: {
          ...updatedAppointment.request,
          date: updatedAppointment.request.date.toISOString(),
        },
      },
      message: `Appointment ${action === "approve" ? "approved" : "rejected"} successfully`,
    });
  } catch (error: any) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update appointment",
      },
      { status: 500 }
    );
  }
}

