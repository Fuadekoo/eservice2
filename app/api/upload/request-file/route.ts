import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { auth } from "@/auth";

const FILEDATA_DIR = path.join(process.cwd(), "filedata");

/**
 * Ensure the upload directory exists
 */
async function ensureUploadDirectory(): Promise<void> {
  try {
    await fs.access(FILEDATA_DIR);
  } catch {
    await fs.mkdir(FILEDATA_DIR, { recursive: true });
  }
}

/**
 * Generate a unique filename
 */
function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const ext = path.extname(originalName);
  return `${timestamp}-${random}${ext}`;
}

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

    // Ensure upload directory exists
    await ensureUploadDirectory();

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "No file uploaded",
        },
        { status: 400 }
      );
    }

    // Validate file type (images and PDFs)
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid file type. Only JPEG, PNG, GIF, WebP images and PDF files are allowed.",
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: "File size exceeds 10MB limit",
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const filename = generateFilename(file.name);
    const filePath = path.join(FILEDATA_DIR, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await fs.writeFile(filePath, buffer);

    // Return the file path (will be served via API endpoint)
    const filepath = `filedata/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        name: file.name,
        filepath,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error: any) {
    console.error("❌ Error uploading file:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to upload file",
      },
      { status: 500 }
    );
  }
}

