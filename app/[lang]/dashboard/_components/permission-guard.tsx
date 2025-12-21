import { checkPagePermission } from "@/lib/check-dashboard-access";
import { AccessDenied } from "./access-denied";
import { ReactNode } from "react";

interface PermissionGuardProps {
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Permission Guard Component
 * 
 * Checks if the current user has the required permission(s) to view the children.
 * If permission is denied, shows AccessDenied or custom fallback.
 */
export async function PermissionGuard({
  permission,
  children,
  fallback,
}: PermissionGuardProps) {
  const { allowed, error } = await checkPagePermission(permission);

  if (!allowed) {
    return fallback || <AccessDenied />;
  }

  return <>{children}</>;
}

