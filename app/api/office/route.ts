import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { officeSchema } from "@/app/[lang]/dashboard/@admin/office/_schema";

/**
 * @swagger
 * /api/office:
 *   get:
 *     tags:
 *       - Offices
 *     summary: Get offices
 *     description: Fetch offices with pagination, search, and filtering
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of offices per page (max 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search offices by name or location
 *       - in: query
 *         name: status
 *         schema:
 *           type: boolean
 *         description: Filter by office status (active/inactive)
 *     responses:
 *       200:
 *         description: Offices fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                         example: "East Shoa Office"
 *                       location:
 *                         type: string
 *                         example: "Adama, Ethiopia"
 *                       status:
 *                         type: boolean
 *                         example: true
 *                       officeLogo:
 *                         type: string
 *                         example: "logo.png"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     pages:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   post:
 *     tags:
 *       - Offices
 *     summary: Create office
 *     description: Create a new office
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 description: Office name
 *                 example: "East Shoa Office"
 *               location:
 *                 type: string
 *                 minLength: 1
 *                 description: Office location
 *                 example: "Adama, Ethiopia"
 *               status:
 *                 type: boolean
 *                 default: true
 *                 description: Office status (active/inactive)
 *               officeLogo:
 *                 type: string
 *                 description: Office logo filename
 *                 example: "logo.png"
 *     responses:
 *       200:
 *         description: Office created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Office created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     location:
 *                       type: string
 *                     status:
 *                       type: boolean
 *                     officeLogo:
 *                       type: string
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

// Pagination constants
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// Simple fuzzy search helper
function fuzzyIncludes(
  searchQuery: string,
  ...fields: (string | null | undefined)[]
): boolean {
  const query = searchQuery.toLowerCase();
  return fields.some((field) => {
    if (!field) return false;
    return field.toLowerCase().includes(query);
  });
}

// Simple pagination response helper
function paginatedResponse(
  data: any[],
  page: number,
  limit: number,
  total: number
) {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// GET - Fetch offices with pagination and search (requires office:read permission)
export async function GET(request: NextRequest) {
  try {
    // Check permission
    const { response, userId } = await requirePermission(request, "office:read");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(request.url);

    // Parse pagination parameters
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(
        1,
        parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10)
      )
    );
    const search = searchParams.get("search")?.trim() || "";
    const includeStats = searchParams.get("includeStats") === "true";

    console.log("📥 Fetching offices from database...", {
      page,
      limit,
      search: search || "none",
      includeStats,
    });

    // For fuzzy search, we'll fetch all offices and filter them
    // This allows for true fuzzy matching (subsequence, case-insensitive, etc.)
    let offices: any[] = [];
    let total = 0;

    if (search && search.trim()) {
      // Fetch all offices for fuzzy matching
      // Note: For very large datasets, consider implementing a hybrid approach
      // (database pre-filtering + fuzzy matching)
      const allOffices = await prisma.office.findMany({
        orderBy: { createdAt: "desc" },
      });

      // Apply fuzzy search filtering using the fuzzyIncludes function
      const searchQuery = search.trim();
      const filteredOffices = allOffices.filter((office) =>
        fuzzyIncludes(
          searchQuery,
          office.name,
          office.address,
          office.roomNumber,
          office.phoneNumber || "",
          office.subdomain,
          office.slogan || ""
        )
      );

      total = filteredOffices.length;

      // Apply pagination to filtered results
      const skip = (page - 1) * limit;
      offices = filteredOffices.slice(skip, skip + limit);
    } else {
      // No search - use normal database pagination for better performance
      const where: any = {};

      // Get total count for pagination
      total = await prisma.office.count({ where });

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Fetch paginated offices
      offices = await prisma.office.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      });
    }

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    console.log(
      `✅ Successfully fetched ${offices.length} offices (page ${page}/${totalPages})`
    );

    // Fetch statistics only if requested (to optimize performance)
    let officesWithStats = offices;
    if (includeStats) {
      officesWithStats = await Promise.all(
        offices.map(async (office) => {
          // Use Promise.all for parallel queries
          const [
            totalRequests,
            totalAppointments,
            staffMembers,
            totalServices,
          ] = await Promise.all([
            prisma.request.count({
              where: {
                service: {
                  officeId: office.id,
                },
              },
            }),
            prisma.appointment.count({
              where: {
                approveStaff: {
                  officeId: office.id,
                },
              },
            }),
            prisma.staff.findMany({
              where: {
                officeId: office.id,
              },
              select: {
                userId: true,
              },
            }),
            prisma.service.count({
              where: {
                officeId: office.id,
              },
            }),
          ]);

          const uniqueUserIds = new Set(
            staffMembers.map((staff) => staff.userId)
          );
          const totalUsers = uniqueUserIds.size;

          return {
            ...office,
            totalRequests,
            totalAppointments,
            totalUsers,
            totalServices,
          };
        })
      );
    } else {
      // Set default stats to 0 if not requested
      officesWithStats = offices.map((office) => ({
        ...office,
        totalRequests: 0,
        totalAppointments: 0,
        totalUsers: 0,
        totalServices: 0,
      }));
    }

    // Serialize dates properly
    const serializedOffices = officesWithStats.map((office) => ({
      ...office,
      startedAt: office.startedAt.toISOString(),
      createdAt: office.createdAt.toISOString(),
      updatedAt: office.updatedAt.toISOString(),
    }));

    // Return paginated response
    return paginatedResponse(serializedOffices, page, limit, total);
  } catch (error: any) {
    console.error("❌ Error fetching offices:", error);
    console.error("❌ Error details:", {
      message: error.message,
      name: error.name,
      code: error.code,
    });
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch offices",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// POST - Create a new office (requires office:create permission)
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const { response, userId } = await requirePermission(request, "office:create");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate the data
    const validationResult = officeSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("❌ Validation failed:", validationResult.error.issues);
      console.error("📝 Received data:", JSON.stringify(body, null, 2));
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationResult.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if subdomain already exists
    const existingOffice = await prisma.office.findFirst({
      where: {
        subdomain: data.subdomain,
      },
    });

    if (existingOffice) {
      return NextResponse.json(
        {
          success: false,
          error: "Subdomain already exists. Please choose a different one.",
        },
        { status: 400 }
      );
    }

    // Create office - convert empty strings to null
    const office = await prisma.office.create({
      data: {
        name: data.name,
        phoneNumber:
          data.phoneNumber === "" || !data.phoneNumber
            ? null
            : data.phoneNumber,
        roomNumber: data.roomNumber,
        address: data.address,
        subdomain: data.subdomain.toLowerCase().trim(),
        logo: data.logo === "" || !data.logo ? null : data.logo,
        slogan: data.slogan === "" || !data.slogan ? null : data.slogan,
        status: data.status ?? true,
        startedAt: data.startedAt || new Date(),
      },
    });

    return NextResponse.json(
      { success: true, data: office, message: "Office created successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Error creating office:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create office",
      },
      { status: 500 }
    );
  }
}
