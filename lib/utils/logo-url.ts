/**
 * Utility function to get the correct URL for a logo file
 * Handles various path formats that might be stored in the database
 */
export function getLogoUrl(logo: string | null | undefined): string | null {
  if (!logo) {
    return null;
  }

  // If it's already a full URL, return it
  if (logo.startsWith("http://") || logo.startsWith("https://")) {
    return logo;
  }

  // If it already starts with /api/upload/logo/, return it as is
  if (logo.startsWith("/api/upload/logo/")) {
    return logo;
  }

  // If it starts with /api/ but not /api/upload/logo/, extract the filename
  if (logo.startsWith("/api/")) {
    // Extract filename from paths like /api/filedata/filename.png or /api/upload/logo/filename.png
    const parts = logo.split("/");
    const filename = parts[parts.length - 1];
    return `/api/upload/logo/${filename}`;
  }

  // Extract filename from various path formats
  // Handle paths like:
  // - "upload/logo/filename.png"
  // - "filedata/upload/logo/filename.png"
  // - "filename.png"
  let filename = logo;

  // Remove any leading path segments
  if (logo.includes("/")) {
    // Extract just the filename (last segment)
    filename = logo.split("/").pop() || logo;
  }

  // Remove any query parameters or fragments
  filename = filename.split("?")[0].split("#")[0];

  // All logos are served via /api/upload/logo/[filename]
  return `/api/upload/logo/${filename}`;
}

