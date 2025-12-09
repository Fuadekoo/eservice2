import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { randomUUID } from "crypto";

// GET - Fetch reports for staff (received from manager OR sent to manager)
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

    // Check if user is staff
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

    const isStaff = dbUser.role?.name?.toLowerCase() === "staff";
    if (!isStaff) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Staff access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "received"; // "received" or "sent"
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const skip = (page - 1) * pageSize;

    // Build where clause based on type
    const where: any = {};

    if (type === "received") {
      // Reports received by this staff (sent from manager)
      where.reportSentTo = session.user.id;
    } else if (type === "sent") {
      // Reports sent by this staff (to manager)
      where.reportSentBy = session.user.id;
    }

    // Add search filter
    if (search && search.trim()) {
      const searchConditions =
        type === "received"
          ? [
              { name: { contains: search } },
              { description: { contains: search } },
              {
                reportSentByUser: {
                  username: { contains: search },
                },
              },
              {
                reportSentByUser: {
                  phoneNumber: { contains: search },
                },
              },
            ]
          : [
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

      where.OR = searchConditions;
    }

    // Add status filter
    if (status && status !== "all") {
      where.receiverStatus = status;
    }

    // Get total count
    const total = await prisma.report.count({ where });

    // Fetch reports with pagination
    const reports = await prisma.report.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
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
    });

    // Serialize dates
    const serializedReports = reports.map((report) => ({
      ...report,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      fileData: report.fileData.map((file: any) => ({
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
    console.error("❌ Error fetching staff reports:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch reports",
      },
      { status: 500 }
    );
  }
}

// POST - Create a new report (staff sends to manager)
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is staff
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

    const isStaff = dbUser.role?.name?.toLowerCase() === "staff";
    if (!isStaff) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Staff access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, reportSentTo, files } = body;

    // Validate required fields
    if (!name || !description || !reportSentTo) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, description, and recipient are required",
        },
        { status: 400 }
      );
    }

    // Get staff's office
    const staffRecord = await prisma.staff.findFirst({
      where: { userId: session.user.id },
      select: { officeId: true },
    });

    if (!staffRecord) {
      return NextResponse.json(
        { success: false, error: "Staff office not found" },
        { status: 403 }
      );
    }

    // Verify that reportSentTo is a manager for the same office
    const recipient = await prisma.user.findUnique({
      where: { id: reportSentTo },
      include: {
        role: {
          include: {
            office: true,
          },
        },
      },
    });

    if (!recipient) {
      return NextResponse.json(
        { success: false, error: "Recipient not found" },
        { status: 404 }
      );
    }

    const isManager =
      recipient.role?.name?.toLowerCase() === "manager" ||
      recipient.role?.name?.toLowerCase() === "office_manager";

    if (!isManager) {
      return NextResponse.json(
        { success: false, error: "Reports can only be sent to managers" },
        { status: 400 }
      );
    }

    // Verify manager is from the same office
    if (recipient.role?.officeId !== staffRecord.officeId) {
      return NextResponse.json(
        {
          success: false,
          error: "Manager must be from the same office as staff",
        },
        { status: 400 }
      );
    }

    // Ensure session.user.id is defined
    const senderId = session.user.id;
    if (!senderId) {
      return NextResponse.json(
        { success: false, error: "User ID not found" },
        { status: 401 }
      );
    }

    // Create report with fileData
    const report = await prisma.report.create({
      data: {
        name,
        description,
        reportSentBy: senderId,
        reportSentTo,
        receiverStatus: "pending",
        fileData:
          files && Array.isArray(files) && files.length > 0
            ? {
                create: files.map(
                  (file: {
                    name: string;
                    filepath: string;
                    description?: string;
                  }) => ({
                    id: randomUUID(),
                    name: file.name,
                    filepath: file.filepath,
                    description: file.description || null,
                  })
                ),
              }
            : undefined,
      },
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
    });

    // Serialize dates
    const serializedReport = {
      ...report,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      fileData: report.fileData.map((file: any) => ({
        ...file,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
      })),
    };

    return NextResponse.json({
      success: true,
      data: serializedReport,
    });
  } catch (error: any) {
    console.error("❌ Error creating staff report:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create report",
      },
      { status: 500 }
    );
  }
}
