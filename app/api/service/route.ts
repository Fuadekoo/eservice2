import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { requirePermission } from "@/lib/rbac";
import { randomUUID } from "crypto";

// GET - Fetch all services with office information (with pagination and search)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedOfficeId = searchParams.get("officeId");
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const skip = (page - 1) * pageSize;

    // Authenticate user (optional for public access)
    const session = await auth();
    let officeId: string | null = null;
    let isAdmin = false;
    let isManager = false;

    // If user is authenticated, check permission and get their office ID
    if (session?.user?.id) {
      // Check permission for authenticated users
      const { response, userId } = await requirePermission(request, "service:read");
      if (response) return response;
      if (!userId) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Get user with role from database
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      const roleName = dbUser?.role?.name?.toLowerCase() || "";
      isAdmin = roleName === "admin" || roleName === "administrator";
      isManager = roleName === "manager" || roleName === "office_manager";

      // For managers, get their office ID - they can only see services from their office
      if (isManager) {
        // First, try to get officeId from staff relation
        const userStaff = await prisma.staff.findFirst({
          where: { userId: userId },
          select: { officeId: true },
        });

        if (userStaff?.officeId) {
          officeId = userStaff.officeId;
        } else if (dbUser.role?.officeId) {
          // Fallback to role's officeId if staff record doesn't exist
          officeId = dbUser.role.officeId;
        }
        
        // If manager still doesn't have an officeId, deny access
        if (!officeId) {
          return NextResponse.json(
            {
              success: false,
              error: "Office not found. Please contact administrator.",
            },
            { status: 403 }
          );
        }
      }
      // Admins can see all services, so we don't set officeId for them
    }

    // If officeId is provided in query and user is not authenticated manager/admin, use it
    // This allows customers/public to view services for a specific office
    if (requestedOfficeId && !officeId) {
      // Verify office exists and is active
      const office = await prisma.office.findUnique({
        where: { id: requestedOfficeId },
      });

      if (office && office.status) {
        officeId = requestedOfficeId;
      }
    }

    // For public/guest access (no authentication or no officeId), fetch all services from active offices
    // This allows the guest service page to display all available services
    // Admins also see all services (they don't have officeId restriction)
    const isPublicAccess = !session?.user || (!officeId && !requestedOfficeId) || isAdmin;

    console.log("📋 Fetching services:", {
      officeId,
      requestedOfficeId,
      search,
      page,
      pageSize,
      userId: session?.user?.id || "anonymous",
    });

    // Build where clause - filter by office (or all active offices for public access)
    const where: any = isPublicAccess
      ? {
          office: {
            status: true, // Only active offices
          },
        }
      : {
          officeId: officeId,
          office: {
            status: true, // Only active offices
          },
        };

    // Add fuzzy search if provided
    // Note: MySQL doesn't support mode: "insensitive" in Prisma
    // We'll handle case-insensitive search in application layer if needed
    if (search && search.trim()) {
      const searchTerm = search.trim();
      if (isPublicAccess) {
        // For public access, search across all active offices
        where.AND = [
          {
            office: {
              status: true,
            },
          },
          {
            OR: [
              { name: { contains: searchTerm } },
              { description: { contains: searchTerm } },
              {
                office: {
                  name: { contains: searchTerm },
                },
              },
            ],
          },
        ];
        delete where.office;
      } else {
        // For authenticated users with office, filter by office
        where.AND = [
          {
            officeId: officeId,
            office: {
              status: true,
            },
          },
          {
            OR: [
              { name: { contains: searchTerm } },
              { description: { contains: searchTerm } },
              {
                office: {
                  name: { contains: searchTerm },
                },
              },
            ],
          },
        ];
        delete where.officeId;
        delete where.office;
      }
    }

    // Get total count for pagination
    const total = await prisma.service.count({ where });

    // Fetch services with pagination
    const services = await prisma.service.findMany({
      where,
      include: {
        office: {
          select: {
            id: true,
            name: true,
            roomNumber: true,
            address: true,
            status: true,
            logo: true,
            slogan: true,
          },
        },
        requirements: true,
        serviceFors: true,
        staffAssignments: {
          include: {
            staff: {
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
          },
        },
      },
      orderBy: {
        name: "asc",
      },
      skip,
      take: pageSize,
    });

    // Format response to include staff assignments
    const formattedServices = services.map((service: any) => ({
      ...service,
      assignedStaff: service.staffAssignments.map((assignment: any) => ({
        id: assignment.staff.id,
        userId: assignment.staff.userId,
        name: assignment.staff.user.username, // Use username as name
        email: null, // User model doesn't have email
        phoneNumber: assignment.staff.user.phoneNumber,
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

// POST - Create a new service (requires service:create permission)
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const { response, userId } = await requirePermission(request, "service:create");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      timeToTake,
      officeId,
      requirements,
      serviceFors,
    } = body;

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

    // Check if user has permission to create services for this office
    // Get user to check their role and permissions
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    const roleName = dbUser?.role?.name?.toLowerCase() || "";
    const isAdmin = roleName === "admin" || roleName === "administrator";

    // If user is not admin, verify they belong to the same office
    if (!isAdmin) {
      const managerStaff = await prisma.staff.findFirst({
        where: { userId },
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

    // Create service with requirements and serviceFors
    const service = await prisma.service.create({
      data: {
        id: randomUUID(),
        name,
        description,
        timeToTake,
        officeId,
        requirements:
          requirements && Array.isArray(requirements)
            ? {
                create: requirements.map((req: any) => ({
                  id: randomUUID(),
                  name: req.name,
                  description: req.description || null,
                })),
              }
            : undefined,
        serviceFors:
          serviceFors && Array.isArray(serviceFors)
            ? {
                create: serviceFors.map((sf: any) => ({
                  id: randomUUID(),
                  name: sf.name,
                  description: sf.description || null,
                })),
              }
            : undefined,
      },
      include: {
        office: {
          select: {
            id: true,
            name: true,
            roomNumber: true,
            address: true,
            status: true,
            logo: true,
            slogan: true,
          },
        },
        requirements: true,
        serviceFors: true,
      },
    });

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
