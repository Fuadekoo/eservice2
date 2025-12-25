"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AccessDenied } from "./access-denied";

interface PagePermissionCheckProps {
  role: string;
  children: React.ReactNode;
}

/**
 * Client-side component to check page permissions
 * This is a fallback - server-side checks should be primary
 */
export function PagePermissionCheck({
  role,
  children,
}: PagePermissionCheckProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    async function checkPermission() {
      try {
        // Extract the path relative to the dashboard
        // e.g., /en/dashboard/office -> office
        const pathParts = pathname.split("/dashboard/");
        const relativePath = pathParts.length > 1 ? pathParts[1] : "";

        const response = await fetch(
          `/api/user/permissions/check-page?role=${encodeURIComponent(
            role
          )}&path=${encodeURIComponent(relativePath)}`
        );

        if (response.ok) {
          const result = await response.json();
          setHasPermission(result.allowed || false);
        } else {
          setHasPermission(false);
        }
      } catch (error) {
        console.error("Error checking page permission:", error);
        setHasPermission(false);
      } finally {
        setIsChecking(false);
      }
    }

    checkPermission();
  }, [pathname, role]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
