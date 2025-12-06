import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";

// GET - Get a specific appointment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
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

    const roleName = dbUser?.role?.name?.toLowerCase() || "";
    const isCustomer = roleName === "customer";

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
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

    // Customers can only view their own appointments
    if (isCustomer && appointment.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...appointment,
        date: appointment.date.toISOString(),
        createdAt: appointment.createdAt.toISOString(),
        updatedAt: appointment.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching appointment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch appointment",
      },
      { status: 500 }
    );
  }
}

// PATCH - Update an appointment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
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

    const body = await request.json();
    const { date, time, notes } = body;

    // Get the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        request: {
          select: {
            statusbystaff: true,
            statusbyadmin: true,
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

    // Get user role
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    const roleName = dbUser?.role?.name?.toLowerCase() || "";
    const isCustomer = roleName === "customer";

    // Customers can only update their own appointments
    if (isCustomer && appointment.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Prevent editing if appointment is approved or completed
    if (appointment.status === "approved" || appointment.status === "completed") {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot update approved or completed appointment",
        },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (date) updateData.date = new Date(date);
    if (time !== undefined) updateData.time = time || null;
    if (notes !== undefined) updateData.notes = notes || null;

    // Update the appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
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
          include: {
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
      },
      message: "Appointment updated successfully",
    });
  } catch (error: any) {
    console.error("❌ Error updating appointment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update appointment",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete an appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
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

    // Get the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        request: {
          select: {
            statusbystaff: true,
            statusbyadmin: true,
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

    // Get user role
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    const roleName = dbUser?.role?.name?.toLowerCase() || "";
    const isCustomer = roleName === "customer";

    // Customers can only delete their own appointments
    if (isCustomer && appointment.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Prevent deleting if appointment is approved or completed
    if (appointment.status === "approved" || appointment.status === "completed") {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete approved or completed appointment",
        },
        { status: 400 }
      );
    }

    // Delete the appointment
    await prisma.appointment.delete({
      where: { id: appointmentId },
    });

    return NextResponse.json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting appointment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete appointment",
      },
      { status: 500 }
    );
  }
}

