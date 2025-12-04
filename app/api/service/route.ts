import { NextRequest, NextResponse } from "next/server";
import { prisma, executeWithRetry } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api/api-permissions";
import { randomUUID } from "crypto";

// GET - Fetch all services with office information (with pagination and search)
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user's office
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the authenticated user's office ID from staff relation
    const userStaff = await prisma.staff.findFirst({
      where: { userId: authUser.id },
      select: { officeId: true },
    });

    if (!userStaff) {
      return NextResponse.json(
        { success: false, error: "User office not found" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedOfficeId = searchParams.get("officeId");
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const skip = (page - 1) * pageSize;

    // Always use the authenticated user's office ID (ignore requested officeId for security)
    const officeId = userStaff.officeId;

    console.log("📋 Fetching services:", {
      officeId,
      requestedOfficeId,
      search,
      page,
      pageSize,
      userId: authUser.id,
    });

    // Build where clause - always filter by authenticated user's office
    const where: any = {
      officeId: officeId,
      office: {
        status: true, // Only active offices
      },
    };

    // Add fuzzy search if provided
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.AND = [
        {
          officeId: officeId,
          office: {
            status: true,
          },
        },
        {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
            {
              office: {
                name: { contains: searchTerm, mode: "insensitive" },
              },
            },
          ],
        },
      ];
      // Remove top-level filters since they're now in AND
      delete where.officeId;
      delete where.office;
    }

    // Get total count for pagination
    const total = await executeWithRetry(
      () => prisma.service.count({ where }),
      1,
      5000
    );

    // Fetch services with pagination
    const services = await executeWithRetry(
      () =>
        prisma.service.findMany({
          where,
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
            staffAssignments: {
              include: {
                staff: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            name: "asc",
          },
          skip,
          take: pageSize,
        }),
      1,
      10000
    );

    // Format response to include staff assignments
    const formattedServices = services.map((service) => ({
      ...service,
      assignedStaff: service.staffAssignments.map((assignment) => ({
        id: assignment.staff.id,
        userId: assignment.staff.userId,
        name: assignment.staff.user.name,
        email: assignment.staff.user.email,
      })),
      staffAssignments: undefined, // Remove raw assignments from response
    }));

    const totalPages = Math.ceil(total / pageSize);

    console.log(
      `✅ Fetched ${formattedServices.length} services (page ${page} of ${totalPages})`
    );

    return NextResponse.json({
      success: true,
      data: formattedServices,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error: any) {
    console.error("❌ Error fetching services:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch services",
      },
      { status: 500 }
    );
  }
}

// POST - Create a new service
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin or manager
    const isAdmin =
      user.role?.name?.toLowerCase() === "admin" ||
      user.role?.name?.toLowerCase() === "administrator";
    const isManager =
      user.role?.name?.toLowerCase() === "manager" ||
      user.role?.name?.toLowerCase() === "office_manager";

    if (!isAdmin && !isManager) {
      return NextResponse.json(
        {
          success: false,
          error: "Only office managers and admins can create services",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, timeToTake, officeId } = body;

    // Validate input
    if (!name || !description || !timeToTake || !officeId) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, description, timeToTake, and officeId are required",
        },
        { status: 400 }
      );
    }

    // Verify office exists and is active
    const office = await prisma.office.findUnique({
      where: { id: officeId },
    });

    if (!office) {
      return NextResponse.json(
        { success: false, error: "Office not found" },
        { status: 404 }
      );
    }

    // If user is manager (not admin), verify they belong to the same office
    if (!isAdmin) {
      const managerStaff = await prisma.staff.findFirst({
        where: { userId: user.id },
      });

      if (!managerStaff || managerStaff.officeId !== officeId) {
        return NextResponse.json(
          {
            success: false,
            error: "You can only create services for your own office",
          },
          { status: 403 }
        );
      }
    }

    // Create service
    const service = await executeWithRetry(
      () =>
        prisma.service.create({
          data: {
            id: randomUUID(),
            name,
            description,
            timeToTake,
            officeId,
          },
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
        }),
      1,
      10000
    );

    console.log(`✅ Created service: ${service.id}`);

    return NextResponse.json({
      success: true,
      data: service,
    });
  } catch (error: any) {
    console.error("❌ Error creating service:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create service",
      },
      { status: 500 }
    );
  }
}
