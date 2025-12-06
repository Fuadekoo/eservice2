import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { randomUUID } from "crypto";

// POST - Create a new request
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Store userId after validation
    const userId = session.user.id;

    const body = await request.json();
    const {
      serviceId,
      currentAddress,
      date,
      status = "pending",
      files = [],
      notes,
    } = body;

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
        userId: userId,
        serviceId,
        currentAddress,
        date: new Date(date),
        statusbystaff: "pending",
        statusbyadmin: "pending",
        fileData:
          files.length > 0
            ? {
                create: files.map(
                  (file: {
                    name: string;
                    filepath: string;
                    description?: string;
                  }) => ({
                    id: randomUUID(),
                    name: file.name,
                    filepath: file.filepath,
                    description: file.description || notes || null,
                  })
                ),
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
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    const officeId = searchParams.get("officeId") || "";
    const status = searchParams.get("status") || "";

    // Only allow users to fetch their own requests (unless admin or manager)
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    const isAdmin =
      dbUser?.role?.name?.toLowerCase() === "admin" ||
      dbUser?.role?.name?.toLowerCase() === "administrator";

    const isManager = dbUser?.role?.name?.toLowerCase() === "manager";
    const isStaff = dbUser?.role?.name?.toLowerCase() === "staff";

    // Build where clause
    const where: any = {};
    let managerStaff: { officeId: string } | null = null;
    let staffRecord: { id: string } | null = null;

    // If manager, filter by manager's office
    if (isManager) {
      // Get manager's office from staff relation
      managerStaff = await prisma.staff.findFirst({
        where: { userId: session.user.id },
        select: { officeId: true },
      });

      if (!managerStaff?.officeId) {
        // Manager has no office, return empty
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            page,
            pageSize,
            total: 0,
            totalPages: 0,
          },
        });
      }
    } else if (isStaff) {
      // Staff can only see requests for services they're assigned to
      staffRecord = await prisma.staff.findFirst({
        where: { userId: session.user.id },
        select: { id: true },
      });

      if (!staffRecord) {
        // Staff has no record, return empty
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            page,
            pageSize,
            total: 0,
            totalPages: 0,
          },
        });
      }

      // Get services assigned to this staff
      const assignedServices = await prisma.serviceStaffAssignment.findMany({
        where: { staffId: staffRecord.id },
        select: { serviceId: true },
      });

      const serviceIds = assignedServices.map((a) => a.serviceId);

      if (serviceIds.length === 0) {
        // No services assigned, return empty
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            page,
            pageSize,
            total: 0,
            totalPages: 0,
          },
        });
      }

      where.serviceId = { in: serviceIds };
    } else if (!isAdmin) {
      // Regular users only see their own requests
      where.userId = session.user.id;
    } else if (userId) {
      // Admin can filter by userId
      where.userId = userId;
    }

    // Office filter (only for admin)
    if (isAdmin && officeId) {
      where.service = {
        officeId: officeId,
      };
    }

    // Status filter - filter by both statusbystaff and statusbyadmin
    // If status is provided, we'll filter where both are that status (for approved/rejected)
    // or where at least one is pending (for pending)
    if (status) {
      if (status === "pending") {
        where.OR = [
          { statusbystaff: "pending" },
          { statusbyadmin: "pending" },
        ];
      } else {
        // For approved/rejected, both must match
        where.AND = [
          { statusbystaff: status },
          { statusbyadmin: status },
        ];
      }
    }

    // Search filter (search in service name, office name, user username)
    if (search) {
      const searchConditions = {
        OR: [
          {
            service: {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            service: {
              office: {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
          },
          {
            user: {
              username: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          },
        ],
      };

      // For managers, we need to combine the office filter with search
      if (isManager && managerStaff?.officeId) {
        where.AND = [
          {
            service: {
              officeId: managerStaff.officeId,
            },
          },
          searchConditions,
        ];
      } else if (isStaff && staffRecord) {
        // For staff, combine service assignment filter with search
        const assignedServices = await prisma.serviceStaffAssignment.findMany({
          where: { staffId: staffRecord.id },
          select: { serviceId: true },
        });
        const serviceIds = assignedServices.map((a) => a.serviceId);
        
        if (serviceIds.length > 0) {
          where.AND = [
            {
              serviceId: { in: serviceIds },
            },
            searchConditions,
          ];
        }
      } else {
        where.OR = searchConditions.OR;
      }
    } else if (isManager && managerStaff?.officeId) {
      // Manager filter without search
      where.service = {
        officeId: managerStaff.officeId,
      };
    } else if (isStaff && staffRecord) {
      // Staff filter without search (already set above)
      // No additional filter needed as serviceId is already set
    }

    // Get total count for pagination
    const total = await prisma.request.count({ where });

    // Fetch requests with pagination
    const requests = await prisma.request.findMany({
      where,
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
        appointments: {
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
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
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
        appointments: req.appointments.map((apt) => ({
          ...apt,
          date: apt.date.toISOString(),
          createdAt: apt.createdAt.toISOString(),
          updatedAt: apt.updatedAt.toISOString(),
        })),
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
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
