import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { randomUUID } from "crypto";

// POST - Create a new request
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { serviceId, currentAddress, date, status = "pending", files = [], notes } = body;

    // Validate required fields
    if (!serviceId || !currentAddress || !date) {
      return NextResponse.json(
        {
          success: false,
          error: "Service ID, current address, and date are required",
        },
        { status: 400 }
      );
    }

    // Verify service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        office: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      );
    }

    // Create request
    const newRequest = await prisma.request.create({
      data: {
        id: randomUUID(),
        userId: session.user.id,
        serviceId,
        currentAddress,
        date: new Date(date),
        status: status as "pending" | "approved" | "rejected",
        fileData: files.length > 0
          ? {
              create: files.map((file: { name: string; filepath: string; description?: string }) => ({
                id: randomUUID(),
                name: file.name,
                filepath: file.filepath,
                description: file.description || notes || null,
              })),
            }
          : undefined,
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

    console.log(`✅ Created request: ${newRequest.id}`);

    return NextResponse.json({
      success: true,
      data: {
        ...newRequest,
        date: newRequest.date.toISOString(),
        createdAt: newRequest.createdAt.toISOString(),
        updatedAt: newRequest.updatedAt.toISOString(),
        fileData: newRequest.fileData.map((file) => ({
          ...file,
          createdAt: file.createdAt.toISOString(),
          updatedAt: file.updatedAt.toISOString(),
        })),
        appointments: newRequest.appointments.map((apt) => ({
          ...apt,
          date: apt.date.toISOString(),
          createdAt: apt.createdAt.toISOString(),
          updatedAt: apt.updatedAt.toISOString(),
        })),
      },
    });
  } catch (error: any) {
    console.error("❌ Error creating request:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create request",
      },
      { status: 500 }
    );
  }
}

// GET - Fetch requests (for authenticated user)
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;

    // Only allow users to fetch their own requests (unless admin)
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    const isAdmin =
      dbUser?.role?.name?.toLowerCase() === "admin" ||
      dbUser?.role?.name?.toLowerCase() === "administrator";

    if (!isAdmin && userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const requests = await prisma.request.findMany({
      where: { userId },
      include: {
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: requests.map((req) => ({
        ...req,
        date: req.date.toISOString(),
        createdAt: req.createdAt.toISOString(),
        updatedAt: req.updatedAt.toISOString(),
        fileData: req.fileData.map((file) => ({
          ...file,
          createdAt: file.createdAt.toISOString(),
          updatedAt: file.updatedAt.toISOString(),
        })),
      })),
    });
  } catch (error: any) {
    console.error("❌ Error fetching requests:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch requests",
      },
      { status: 500 }
    );
  }
}

