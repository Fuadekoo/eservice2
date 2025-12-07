import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { promisify } from "util";

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
  request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
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

  try {
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
    if (isPdf) {
      headers["Content-Disposition"] = `inline; filename="${filename}"`;
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      Object.prototype.hasOwnProperty.call(error, "code") &&
      (error as { code?: string }).code === "ENOENT"
    ) {
      return NextResponse.json({ error: "FILE NOT FOUND" }, { status: 404 });
    }
    console.error("Error serving file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
