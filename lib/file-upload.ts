import { promises as fs } from "fs";
import path from "path";

// Logos are stored in filedata/upload/logo (not in public)
const UPLOAD_DIR = path.join(process.cwd(), "filedata", "upload", "logo");

/**
 * Ensure the upload directory exists, create it if it doesn't
 */
export async function ensureUploadDirectory(): Promise<void> {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    // Directory doesn't exist, create it
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Get the full path for a file in the upload directory
 */
export function getUploadPath(filename: string): string {
  return path.join(UPLOAD_DIR, filename);
}

/**
 * Get the API URL for an uploaded file (served via API endpoint)
 */
export function getUploadUrl(filename: string): string {
  return `/api/upload/logo/${filename}`;
}

/**
 * Generate a unique filename with extension
 */
export function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const ext = path.extname(originalName);
  return `${timestamp}-${random}${ext}`;
}

/**
 * Delete a file from the upload directory
 */
export async function deleteUploadedFile(filename: string): Promise<void> {
  try {
    const filePath = getUploadPath(filename);
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Failed to delete file ${filename}:`, error);
  }
}
