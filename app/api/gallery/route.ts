import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { gallerySchema } from "@/app/[lang]/dashboard/@admin/configuration/gallery/_schema";
import { randomUUID } from "crypto";

/**
 * @swagger
 * /api/gallery:
 *   get:
 *     tags:
 *       - Gallery
 *     summary: Get galleries
 *     description: Fetch all galleries with their images. Public access allowed for guest users.
 *     responses:
 *       200:
 *         description: Galleries fetched successfully
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
 *                         example: "Office Opening Ceremony"
 *                       description:
 *                         type: string
 *                         example: "Photos from our grand opening ceremony"
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       images:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             filename:
 *                               type: string
 *                               example: "ceremony1.jpg"
 *                             order:
 *                               type: integer
 *                               example: 1
 *                             altText:
 *                               type: string
 *                               example: "Main hall during opening ceremony"
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
 *       - Gallery
 *     summary: Create gallery
 *     description: Create a new gallery
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
 *                 description: Gallery title
 *                 example: "Office Opening Ceremony"
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 description: Gallery description
 *                 example: "Photos from our grand opening ceremony"
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the gallery is active/visible
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                       description: Image filename
 *                       example: "ceremony1.jpg"
 *                     order:
 *                       type: integer
 *                       description: Display order
 *                       example: 1
 *                     altText:
 *                       type: string
 *                       description: Alt text for accessibility
 *                       example: "Main hall during opening ceremony"
 *                 description: List of images for the gallery
 *     responses:
 *       200:
 *         description: Gallery created successfully
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
 *                   example: "Gallery created successfully"
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
 *                     isActive:
 *                       type: boolean
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

// GET - Fetch all galleries (public access for guest users)
export async function GET(request: NextRequest) {
  try {
    // Allow public access - no authentication required for viewing galleries
    const galleries = await prisma.gallery.findMany({
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: galleries,
    });
  } catch (error: any) {
    console.error("❌ Error fetching galleries:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch galleries" },
      { status: 500 }
    );
  }
}

// POST - Create a new gallery (requires gallery:create permission)
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const { response, userId } = await requirePermission(request, "gallery:create");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = gallerySchema.safeParse(body);

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

    const { name, description, images } = validationResult.data;

    // Create gallery with images
    const newGallery = await prisma.gallery.create({
      data: {
        id: randomUUID(),
        name,
        description: description || null,
        images: {
          create: images.map((filename, index) => ({
            id: randomUUID(),
            filename,
            order: index,
          })),
        },
      },
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    console.log("✅ Gallery created:", newGallery.id);

    return NextResponse.json(
      {
        success: true,
        data: newGallery,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Error creating gallery:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create gallery" },
      { status: 500 }
    );
  }
}
