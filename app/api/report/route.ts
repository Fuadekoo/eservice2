import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";

// GET - Fetch reports sent by the authenticated admin
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

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 }
      );
    }

    const isAdmin = dbUser.role?.name?.toLowerCase() === "admin";
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const skip = (page - 1) * pageSize;

    // Build where clause - only reports sent by this admin
    const where: any = {
      reportSentBy: session.user.id,
    };

    // Add search filter
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        {
          reportSentToUser: {
            username: { contains: search },
          },
        },
        {
          reportSentToUser: {
            phoneNumber: { contains: search },
          },
        },
      ];
    }

    // Add status filter
    if (status && status !== "all") {
      where.receiverStatus = status;
    }

    // Get total count
    const total = await prisma.report.count({ where });

    // Fetch reports
    const reports = await prisma.report.findMany({
      where,
      include: {
        fileData: {
          select: {
            id: true,
            name: true,
            filepath: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        reportSentToUser: {
          select: {
            id: true,
            username: true,
            phoneNumber: true,
          },
        },
        reportSentByUser: {
          select: {
            id: true,
            username: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    });

    // Serialize dates
    const serializedReports = reports.map((report) => ({
      ...report,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      fileData: report.fileData.map((file) => ({
        ...file,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
      })),
    }));

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: serializedReports,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching reports:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch reports",
      },
      { status: 500 }
    );
  }
}
