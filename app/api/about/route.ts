import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { aboutSchema } from "@/app/[lang]/dashboard/@admin/configuration/about/_schema";
import { randomUUID } from "crypto";

/**
 * @swagger
 * /api/about:
 *   get:
 *     tags:
 *       - About
 *     summary: Get about sections
 *     description: Fetch all about sections. Public access allowed for guest users.
 *     responses:
 *       200:
 *         description: About sections fetched successfully
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
 *                       title:
 *                         type: string
 *                         example: "About East Shoa Government Services"
 *                       description:
 *                         type: string
 *                         example: "We provide comprehensive government services to our community..."
 *                       content:
 *                         type: string
 *                         example: "East Shoa Government Services is committed to..."
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
 *       - About
 *     summary: Create about section
 *     description: Create a new about section
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 description: About section title
 *                 example: "About East Shoa Government Services"
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 description: Brief description of the about section
 *                 example: "We provide comprehensive government services to our community"
 *               content:
 *                 type: string
 *                 description: Detailed content of the about section
 *                 example: "East Shoa Government Services is committed to delivering..."
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the about section is active/visible
 *     responses:
 *       200:
 *         description: About section created successfully
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
 *                   example: "About section created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     content:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

// GET - Fetch all about sections (public access for guest users)
export async function GET(request: NextRequest) {
  try {
    // Allow public access - no authentication required for viewing about sections
    console.log("📥 Fetching about sections from database...");

    const aboutSections = await prisma.about.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`✅ Found ${aboutSections.length} about sections`);

    return NextResponse.json({
      success: true,
      data: aboutSections,
    });
  } catch (error: any) {
    console.error("❌ Error fetching about sections:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch about sections",
      },
      { status: 500 }
    );
  }
}

// POST - Create a new about section (requires about:manage permission)
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const { response, userId } = await requirePermission(request, "about:manage");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = aboutSchema.safeParse(body);

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

    // Create about section
    const newAbout = await prisma.about.create({
      data: {
        id: randomUUID(),
        name,
        description: description || null,
        image,
      },
    });

    console.log("✅ About section created:", newAbout.id);

    return NextResponse.json(
      {
        success: true,
        data: newAbout,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Error creating about section:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create about section",
      },
      { status: 500 }
    );
  }
}

