import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import prisma from "@/lib/db";

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     tags:
 *       - User Management
 *     summary: Get user profile
 *     description: Retrieve the current user's profile information
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     username:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [admin, manager, staff, user]
 *                     isActive:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Missing or invalid authentication
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 *
 *   put:
 *     tags:
 *       - User Management
 *     summary: Update user profile
 *     description: Update the current user's profile information (username and phone number)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: New username (optional)
 *               phone:
 *                 type: string
 *                 description: New phone number (optional)
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                   example: "Profile updated successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - Username or phone number already exists
 *       401:
 *         description: Unauthorized - Missing or invalid authentication
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    // Check permission
    const { response, userId } = await requirePermission(request, "profile:read");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          error: "Unauthorized" 
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: "User not found" 
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: true,
        user 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to fetch profile" 
      },
      { status: 500 }
    );
  }
}

// PUT - Update user profile (requires profile:update permission)
export async function PUT(request: NextRequest) {
  try {
    // Check permission
    const { response, userId } = await requirePermission(request, "profile:update");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          error: "Unauthorized" 
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, phone } = body;

    // Check if username or phone already exists (if changed)
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: username,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { 
            success: false,
            error: "Username already exists" 
          },
          { status: 400 }
        );
      }
    }

    if (phone) {
      const existingUser = await prisma.user.findFirst({
        where: {
          phoneNumber: phone,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { 
            success: false,
            error: "Phone number already exists" 
          },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username: username }),
        ...(phone && { phoneNumber: phone }),
      },
    });

    return NextResponse.json(
      { 
        success: true,
        message: "Profile updated successfully",
        user: updatedUser
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to update profile" 
      },
      { status: 500 }
    );
  }
}

