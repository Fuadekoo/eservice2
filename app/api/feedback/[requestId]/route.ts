import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { randomUUID } from "crypto";

// GET - Get feedback for a request (requires feedback:read permission)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> | { requestId: string } }
) {
  try {
    // Check permission
    const { response, userId } = await requirePermission(request, "feedback:read");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const requestId = resolvedParams.requestId;

    // Get feedback for the request
    const feedback = await prisma.customerSatisfaction.findUnique({
      where: { requestId },
      include: {
        request: {
          select: {
            id: true,
            date: true,
            userId: true,
          },
        },
      },
    });

    // Verify the request belongs to the user (for customers)
    if (feedback && feedback.request.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: feedback
        ? {
            id: feedback.id,
            requestId: feedback.requestId,
            rating: feedback.rating,
            comment: feedback.comment,
            createdAt: feedback.createdAt.toISOString(),
            updatedAt: feedback.updatedAt.toISOString(),
            requestDate: feedback.request.date.toISOString(),
          }
        : null,
    });
  } catch (error: any) {
    console.error("❌ Error fetching feedback:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch feedback",
      },
      { status: 500 }
    );
  }
}

// POST/PUT - Create or update feedback for a request (requires feedback:create permission)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> | { requestId: string } }
) {
  try {
    // Check permission
    const { response, userId } = await requirePermission(request, "feedback:create");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const resolvedParams = await Promise.resolve(params);
    const requestId = resolvedParams.requestId;

    const body = await request.json();
    const { rating, comment } = body;

    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        {
          success: false,
          error: "Rating is required and must be between 1 and 5",
        },
        { status: 400 }
      );
    }

    // Verify request exists and belongs to the user
    const requestData = await prisma.request.findUnique({
      where: { id: requestId },
      select: {
        userId: true,
        date: true,
      },
    });

    if (!requestData) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 }
      );
    }

    if (requestData.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - You can only provide feedback for your own requests" },
        { status: 403 }
      );
    }

    // Check if feedback already exists
    const existingFeedback = await prisma.customerSatisfaction.findUnique({
      where: { requestId },
    });

    let feedback;
    if (existingFeedback) {
      // Update existing feedback
      feedback = await prisma.customerSatisfaction.update({
        where: { id: existingFeedback.id },
        data: {
          rating,
          comment: comment || null,
        },
        include: {
          request: {
            select: {
              id: true,
              date: true,
            },
          },
        },
      });
    } else {
      // Create new feedback
      feedback = await prisma.customerSatisfaction.create({
        data: {
          id: randomUUID(),
          requestId,
          rating,
          comment: comment || null,
        },
        include: {
          request: {
            select: {
              id: true,
              date: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: feedback.id,
        requestId: feedback.requestId,
        rating: feedback.rating,
        comment: feedback.comment,
        createdAt: feedback.createdAt.toISOString(),
        updatedAt: feedback.updatedAt.toISOString(),
        requestDate: feedback.request.date.toISOString(),
      },
      message: existingFeedback
        ? "Feedback updated successfully"
        : "Feedback submitted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error saving feedback:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save feedback",
      },
      { status: 500 }
    );
  }
}

