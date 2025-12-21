"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface RolePermissionStatusProps {
  roleId: string;
  roleName: string;
  onClick?: () => void;
}

export function RolePermissionStatus({
  roleId,
  roleName,
  onClick,
}: RolePermissionStatusProps) {
  const [status, setStatus] = useState<"loading" | "full" | "partial" | "none" | "error">("loading");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const roleNameLower = roleName.toLowerCase().trim();
    const adminCheck = roleNameLower === "admin" || roleNameLower === "administrator";
    setIsAdmin(adminCheck);
    
    // For admin, assume full permissions (don't need to fetch)
    if (adminCheck) {
      setStatus("full");
      return;
    }

    // Fetch permission status for non-admin roles
    fetch(`/api/role/${roleId}/permissions`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          const { hasFullPermissions, assignedPermissionCount, expectedPermissionCount } = result.data;
          
          if (hasFullPermissions) {
            setStatus("full");
          } else if (assignedPermissionCount === 0) {
            setStatus("none");
          } else {
            setStatus("partial");
          }
        } else {
          setStatus("error");
        }
      })
      .catch(() => {
        setStatus("error");
      });
  }, [roleId, roleName]);

  if (status === "loading") {
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading...
      </Badge>
    );
  }

  if (status === "error") {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        <XCircle className="h-3 w-3" />
        Error
      </Badge>
    );
  }

  const getBadgeContent = () => {
    switch (status) {
      case "full":
        return (
          <>
            <CheckCircle2 className="h-3 w-3" />
            Full Permissions
          </>
        );
      case "partial":
        return (
          <>
            <Shield className="h-3 w-3" />
            Partial Permissions
          </>
        );
      case "none":
        return (
          <>
            <XCircle className="h-3 w-3" />
            No Permissions
          </>
        );
      default:
        return null;
    }
  };

  const badgeVariant = status === "full" ? "default" : status === "partial" ? "secondary" : "outline";

  if (onClick) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-1"
        onClick={onClick}
      >
        <Badge variant={badgeVariant} className="gap-1 cursor-pointer">
          {getBadgeContent()}
        </Badge>
      </Button>
    );
  }

  return (
    <Badge variant={badgeVariant} className="gap-1">
      {getBadgeContent()}
    </Badge>
  );
}

