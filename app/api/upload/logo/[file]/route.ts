import fs from "fs";
import path from "path";
import { promisify } from "util";

const readFileAsync = promisify(fs.readFile);
const statAsync = promisify(fs.stat);

// Logos are stored in filedata/upload/logo
const LOGO_STORAGE_PATH = path.resolve(process.cwd(), "filedata", "upload", "logo");

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
    default:
      return "image/jpeg";
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const filename = (await params).file;

  if (!filename) {
    return new Response(JSON.stringify({ error: "Filename is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Security: prevent path traversal
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return new Response(JSON.stringify({ error: "Invalid filename" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const filePath = path.join(LOGO_STORAGE_PATH, filename);

  try {
    const stats = await statAsync(filePath);
    if (!stats.isFile()) {
      return new Response(JSON.stringify({ error: "Not a file" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const fileBuffer = await readFileAsync(filePath);
    const mimeType = getMimeType(filePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": stats.size.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      Object.prototype.hasOwnProperty.call(error, "code") &&
      (error as { code?: string }).code === "ENOENT"
    ) {
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.error("Error serving logo file:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

