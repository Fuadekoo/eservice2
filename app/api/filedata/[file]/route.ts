import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { requirePermission } from "@/lib/rbac";

const readFileAsync = promisify(fs.readFile);
const statAsync = promisify(fs.stat);

// Files are stored in filedata folder (not in public)
const FILE_STORAGE_PATH = path.resolve(process.cwd(), "filedata");

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".pdf":
      return "application/pdf";
    case ".txt":
      return "text/plain";
    default:
      return "application/octet-stream";
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  try {
    // Check permission for file download
    const { response, userId } = await requirePermission(request, "file:download");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const filename = (await params).file;

    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }

    if (filename.includes("..") || filename.includes("/")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const filePath = path.join(FILE_STORAGE_PATH, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "FILE NOT FOUND" }, { status: 404 });
    }

    const stats = await statAsync(filePath);
    if (!stats.isFile()) {
      return NextResponse.json({ error: "Not a file" }, { status: 404 });
    }

    const fileBuffer = await readFileAsync(filePath);
    const mimeType = getMimeType(filePath);
    const isPdf = mimeType === "application/pdf";

    // Prepare headers
    const headers: Record<string, string> = {
      "Content-Type": mimeType,
      "Content-Length": stats.size.toString(),
    };

    // For PDFs, set Content-Disposition to inline so they open in browser
    // Also add headers to allow iframe embedding
    if (isPdf) {
      headers["Content-Disposition"] = `inline; filename="${filename}"`;
      headers["X-Content-Type-Options"] = "nosniff";
      // Allow iframe embedding from same origin
      headers["X-Frame-Options"] = "SAMEORIGIN";
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return NextResponse.json({ error: "FILE NOT FOUND" }, { status: 404 });
    }
    console.error("Error serving file:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
