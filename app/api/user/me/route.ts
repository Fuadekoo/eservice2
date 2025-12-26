import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/rbac";

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get current user
 *     description: Get information about the currently authenticated user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     username:
 *                       type: string
 *                       example: "johndoe_5678"
 *                     phoneNumber:
 *                       type: string
 *                       example: "0912345678"
 *                     role:
 *                       type: string
 *                       example: "customer"
 *                       enum: ["admin", "manager", "staff", "customer"]
 *       401:
 *         description: Unauthorized - user not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

// GET - Get current authenticated user (requires profile:read permission)
export async function GET(request: NextRequest) {
  try {
    // Check permission
    const { response, userId } = await requirePermission(request, "profile:read");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch user data from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        phoneNumber: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        phoneNumber: user.phoneNumber,
        role: user.role?.name || null,
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching current user:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch user",
      },
      { status: 500 }
    );
  }
}

