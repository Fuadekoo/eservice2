/**
 * Utility function to get the correct URL for a logo file
 * Handles various path formats that might be stored in the database
 * Logos are stored in filedata/ and served via /api/filedata/[filename]
 */
export function getLogoUrl(logo: string | null | undefined): string | null {
  if (!logo) {
    return null;
  }

  // If it's already a full URL, return it
  if (logo.startsWith("http://") || logo.startsWith("https://")) {
    return logo;
  }

  // If it already starts with /api/filedata/, return it as is
  if (logo.startsWith("/api/filedata/")) {
    return logo;
  }

  // If it starts with /api/upload/logo/, convert to /api/filedata/
  if (logo.startsWith("/api/upload/logo/")) {
    const parts = logo.split("/");
    const filename = parts[parts.length - 1];
    return `/api/filedata/${filename}`;
  }

  // If it starts with /api/ but not /api/filedata/, extract the filename
  if (logo.startsWith("/api/")) {
    // Extract filename from paths like /api/filedata/filename.png
    const parts = logo.split("/");
    const filename = parts[parts.length - 1];
    return `/api/filedata/${filename}`;
  }

  // Extract filename from various path formats
  // Handle paths like:
  // - "upload/logo/filename.png"
  // - "filedata/upload/logo/filename.png"
  // - "filedata/filename.png"
  // - "filename.png"
  let filename = logo;

  // Remove any leading path segments
  if (logo.includes("/")) {
    // Extract just the filename (last segment)
    filename = logo.split("/").pop() || logo;
  }

  // Remove any query parameters or fragments
  filename = filename.split("?")[0].split("#")[0];

  // All logos are served via /api/filedata/[filename]
  return `/api/filedata/${filename}`;
}

