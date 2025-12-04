import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import {
  ensureUploadDirectory,
  getUploadPath,
  getUploadUrl,
  generateFilename,
} from "@/lib/file-upload";

export async function POST(request: NextRequest) {
  try {
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

    // Validate file type (only images)
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: "File size exceeds 5MB limit",
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const filename = generateFilename(file.name);
    const filePath = getUploadPath(filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await fs.writeFile(filePath, buffer);

    // Return the public URL
    const publicUrl = getUploadUrl(filename);

    return NextResponse.json({
      success: true,
      data: {
        filename,
        url: publicUrl,
        size: file.size,
        type: file.type,
      },
      message: "File uploaded successfully",
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

// DELETE endpoint to remove uploaded files
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename } = body;

    if (!filename) {
      return NextResponse.json(
        {
          success: false,
          error: "Filename is required",
        },
        { status: 400 }
      );
    }

    const filePath = getUploadPath(filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "File not found",
        },
        { status: 404 }
      );
    }

    // Delete the file
    await fs.unlink(filePath);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting file:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete file",
      },
      { status: 500 }
    );
  }
}
