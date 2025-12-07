import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";

// GET - Fetch services assigned to the logged-in staff
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

    // Get user role
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    const isStaff = dbUser?.role?.name?.toLowerCase() === "staff";

    if (!isStaff) {
      return NextResponse.json(
        { success: false, error: "Only staff can access this endpoint" },
        { status: 403 }
      );
    }

    // Get staff record
    const staffRecord = await prisma.staff.findFirst({
      where: { userId: userId },
      select: { id: true, officeId: true },
    });

    if (!staffRecord) {
      return NextResponse.json(
        { success: false, error: "Staff record not found" },
        { status: 403 }
      );
    }

    const staffId = staffRecord.id;
    const officeId = staffRecord.officeId;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "12");
    const skip = (page - 1) * pageSize;

    // Build where clause for services assigned to this staff
    const where: any = {
      officeId: officeId,
      staffAssignments: {
        some: {
          staffId: staffId,
        },
      },
    };

    // Get services with pagination
    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          office: {
            select: {
              id: true,
              name: true,
              address: true,
              roomNumber: true,
              logo: true,
              slogan: true,
            },
          },
          requirements: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          serviceFors: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          staffAssignments: {
            select: {
              id: true,
              staff: {
                select: {
                  id: true,
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
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: pageSize,
      }),
      prisma.service.count({ where }),
    ]);

    // Filter by search term in application layer (case-insensitive)
    let filteredServices = services;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredServices = services.filter(
        (service) =>
          service.name.toLowerCase().includes(searchLower) ||
          service.description?.toLowerCase().includes(searchLower) ||
          service.office.name.toLowerCase().includes(searchLower)
      );
    }

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: filteredServices.map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        timeToTake: service.timeToTake,
        officeId: service.officeId,
        office: service.office,
        requirements: service.requirements,
        serviceFors: service.serviceFors,
        assignedStaff: service.staffAssignments.map((assignment) => ({
          id: assignment.staff.id,
          name: assignment.staff.user.username,
          phoneNumber: assignment.staff.user.phoneNumber,
        })),
        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        pageSize,
        total: search ? filteredServices.length : total,
        totalPages: search
          ? Math.ceil(filteredServices.length / pageSize)
          : totalPages,
      },
    });
  } catch (error: any) {
    console.error("Error fetching staff services:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch services",
      },
      { status: 500 }
    );
  }
}
