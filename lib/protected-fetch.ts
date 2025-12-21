/**
 * Protected Fetch Utility
 * 
 * Wraps fetch calls with permission checking.
 * This ensures that API calls only happen if the user has the required permission.
 * 
 * Note: The actual permission checking happens on the server side in API routes.
 * This utility provides a convenient way to handle permission errors on the client.
 */

export interface FetchOptions extends RequestInit {
  requiredPermission?: string | string[];
  skipPermissionCheck?: boolean; // For public endpoints
}

/**
 * Protected fetch wrapper that handles permission errors gracefully
 * 
 * @param url - API endpoint URL
 * @param options - Fetch options including requiredPermission
 * @returns Fetch response or throws error
 */
export async function protectedFetch(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { requiredPermission, skipPermissionCheck, ...fetchOptions } = options;

  // If permission check is skipped, just do a normal fetch
  if (skipPermissionCheck || !requiredPermission) {
    const response = await fetch(url, fetchOptions);

    // Handle 403 Forbidden (permission denied)
    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || "You don't have permission to perform this action"
      );
    }

    return response;
  }

  // Make the fetch request
  const response = await fetch(url, fetchOptions);

  // Handle permission errors
  if (response.status === 403) {
    const errorData = await response.json().catch(() => ({}));
    const permissionMessage = Array.isArray(requiredPermission)
      ? requiredPermission.join(" or ")
      : requiredPermission;
    
    throw new Error(
      errorData.error || `Permission required: ${permissionMessage}`
    );
  }

  if (response.status === 401) {
    throw new Error("Unauthorized - Please log in again");
  }

  return response;
}

/**
 * Helper to create a fetch function with default permission
 */
export function createProtectedFetch(defaultPermission?: string | string[]) {
  return async (url: string, options: FetchOptions = {}) => {
    const permission = options.requiredPermission || defaultPermission;
    return protectedFetch(url, {
      ...options,
      requiredPermission: permission,
    });
  };
}

