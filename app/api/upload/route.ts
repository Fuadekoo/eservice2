import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requirePermission } from "@/lib/rbac";

const FILEDATA_DIR = path.join(process.cwd(), "filedata");
// Remove the UPLOAD_DIR and use FILEDATA_DIR directly

function getTimestampUUID(ext: string) {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}.${ext}`;
}

export async function POST(req: Request) {
  try {
    // Check permission (same as /api/upload/request-file)
    const { response, userId } = await requirePermission(
      req as any,
      "file:upload"
    );
    if (response) return response as any;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const form = await req.formData();
    const chunk = form.get("chunk") as File | null;
    let filename = (form.get("filename") as string | null) || null;
    const chunkIndexStr = form.get("chunkIndex") as string | null;
    const totalChunksStr = form.get("totalChunks") as string | null;
    const totalSizeStr = form.get("totalSize") as string | null;

    if (!chunk || chunk.size === 0) {
      return NextResponse.json(
        { error: "Missing file chunk" },
        { status: 400 }
      );
    }
    if (!chunkIndexStr || !totalChunksStr) {
      return NextResponse.json(
        { error: "Missing chunk indexes" },
        { status: 400 }
      );
    }

    // Basic validation: allow only common image extensions and PDFs
    const candidateName = filename || (chunk.name as string | undefined) || "";
    const extWithDot = path.extname(candidateName).toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"];
    if (extWithDot && !allowedExts.includes(extWithDot)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Optional total size limit (client can send totalSize)
    if (totalSizeStr) {
      const totalSize = parseInt(totalSizeStr, 10);
      const maxTotalSize = 50 * 1024 * 1024; // 50MB
      if (Number.isFinite(totalSize) && totalSize > maxTotalSize) {
        return NextResponse.json(
          { error: "File size exceeds 50MB limit" },
          { status: 400 }
        );
      }
    }

    // Ensure directory exists
    if (!fs.existsSync(FILEDATA_DIR))
      fs.mkdirSync(FILEDATA_DIR, { recursive: true });

    // Determine extension and ensure filename present
    let ext = path.extname(filename || "").replace(".", "");
    if (!ext) {
      const original = chunk.name as string | undefined;
      if (original && original.includes(".")) {
        ext = original.split(".").pop() as string;
      } else {
        ext = "bin";
      }
    }
    if (!filename) filename = getTimestampUUID(ext);

    const baseName = filename.replace(/\.[^/.]+$/, "");
    const chunkFolder = path.join(FILEDATA_DIR, `${baseName}_chunks`);
    if (!fs.existsSync(chunkFolder))
      fs.mkdirSync(chunkFolder, { recursive: true });

    // Write this chunk
    const buffer = Buffer.from(await chunk.arrayBuffer());
    const chunkPath = path.join(chunkFolder, `chunk_${chunkIndexStr}`);
    fs.writeFileSync(chunkPath, buffer);

    const idx = parseInt(chunkIndexStr, 10);
    const total = parseInt(totalChunksStr, 10);

    if (idx + 1 === total) {
      // Join chunks
      const finalPath = path.join(FILEDATA_DIR, filename);
      const ws = fs.createWriteStream(finalPath);
      try {
        for (let i = 0; i < total; i++) {
          const part = path.join(chunkFolder, `chunk_${i}`);
          if (!fs.existsSync(part)) {
            return NextResponse.json(
              { error: `Missing chunk_${i}` },
              { status: 500 }
            );
          }
          const data = fs.readFileSync(part);
          ws.write(data);
        }
        ws.end();
        await new Promise<void>((resolve, reject) => {
          ws.on("finish", () => resolve());
          ws.on("error", reject);
        });
      } finally {
        try {
          fs.rmSync(chunkFolder, { recursive: true, force: true });
        } catch {}
      }

      // Return just the filename without any path prefix
      return NextResponse.json({ success: true, filename: filename });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
