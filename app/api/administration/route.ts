import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { administrationSchema } from "@/app/[lang]/dashboard/@admin/configuration/about/_schema";
import { randomUUID } from "crypto";

/**
 * @swagger
 * /api/administration:
 *   get:
 *     tags:
 *       - Administration
 *     summary: Get administrations
 *     description: Fetch all administration members. Public access allowed for guest users.
 *     responses:
 *       200:
 *         description: Administrations fetched successfully
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
 *                         example: "John Doe"
 *                       position:
 *                         type: string
 *                         example: "Director General"
 *                       bio:
 *                         type: string
 *                         example: "Experienced administrator with 15 years of service"
 *                       photo:
 *                         type: string
 *                         example: "john-doe.jpg"
 *                       order:
 *                         type: integer
 *                         example: 1
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Internal server error
 *   post:
 *     tags:
 *       - Administration
 *     summary: Create administration member
 *     description: Create a new administration member
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
 *               - position
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 description: Full name of the administrator
 *                 example: "John Doe"
 *               position:
 *                 type: string
 *                 minLength: 1
 *                 description: Job position/title
 *                 example: "Director General"
 *               bio:
 *                 type: string
 *                 description: Biography of the administrator
 *                 example: "Experienced administrator with 15 years of service"
 *               photo:
 *                 type: string
 *                 description: Photo filename
 *                 example: "john-doe.jpg"
 *               order:
 *                 type: integer
 *                 default: 0
 *                 description: Display order
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the administrator is active/visible
 *     responses:
 *       200:
 *         description: Administration member created successfully
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
 *                   example: "Administration member created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     position:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     photo:
 *                       type: string
 *                     order:
 *                       type: integer
 *                     isActive:
 *                       type: boolean
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

// GET - Fetch all administrations (public access for guest users)
export async function GET(request: NextRequest) {
  try {
    // Allow public access - no authentication required for viewing administrations
    console.log("📥 Fetching administrations from database...");

    const administrations = await prisma.administration.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`✅ Found ${administrations.length} administrations`);

    return NextResponse.json({
      success: true,
      data: administrations,
    });
  } catch (error: any) {
    console.error("❌ Error fetching administrations:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch administrations",
      },
      { status: 500 }
    );
  }
}

// POST - Create a new administration (requires administration:manage permission)
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const { response, userId } = await requirePermission(
      request,
      "administration:manage"
    );
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = administrationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, description, image } = validationResult.data;

    // Create administration
    const newAdministration = await prisma.administration.create({
      data: {
        id: randomUUID(),
        name,
        description: description || null,
        image,
      },
    });

    console.log("✅ Administration created:", newAdministration.id);

    return NextResponse.json(
      {
        success: true,
        data: newAdministration,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Error creating administration:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create administration",
      },
      { status: 500 }
    );
  }
}
