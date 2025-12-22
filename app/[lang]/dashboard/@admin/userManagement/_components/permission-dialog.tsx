"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Search,
  Shield,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Role } from "../_types";

interface Permission {
  id: string;
  name: string;
  assigned: boolean;
  expected: boolean;
}

interface PermissionDialogProps {
  role: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PermissionDialog({
  role,
  open,
  onOpenChange,
  onSuccess,
}: PermissionDialogProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasFullPermissions, setHasFullPermissions] = useState(false);
  const [expectedCount, setExpectedCount] = useState(0);
  const [assignedCount, setAssignedCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdminRole, setIsAdminRole] = useState(false);

  // Fetch permissions when dialog opens
  useEffect(() => {
    if (open && role) {
      fetchPermissions();
      const roleName = role.name.toLowerCase().trim();
      setIsAdminRole(
        roleName === "admin" || roleName === "administrator"
      );
    } else {
      setSearchQuery("");
    }
  }, [open, role]);

  const fetchPermissions = async () => {
    if (!role) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/role/${role.id}/permissions`);
      const result = await response.json();

      if (result.success) {
        const perms = result.data.allPermissions || [];
        setPermissions(perms);
        setHasFullPermissions(result.data.hasFullPermissions || false);
        setExpectedCount(result.data.expectedPermissionCount || 0);
        setAssignedCount(result.data.assignedPermissionCount || 0);

        // Set selected permissions
        const assigned = new Set<string>(
          perms.filter((p: Permission) => p.assigned).map((p: Permission) => p.id)
        );
        setSelectedPermissions(assigned);
      } else {
        toast.error(result.error || "Failed to fetch permissions");
      }
    } catch (error: any) {
      console.error("Error fetching permissions:", error);
      toast.error("Failed to fetch permissions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePermission = (permissionId: string) => {
    if (isAdminRole) {
      toast.error("Cannot modify admin permissions. Admin roles must have all permissions.");
      return;
    }

    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  const handleAssignFull = async () => {
    if (!role) return;
    if (isAdminRole) {
      toast.error("Admin roles already have all permissions");
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(
        `/api/role/${role.id}/permissions/assign-full`,
        {
          method: "POST",
        }
      );
      const result = await response.json();

      if (result.success) {
        toast.success(result.message || "Full permissions assigned successfully");
        await fetchPermissions();
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to assign full permissions");
      }
    } catch (error: any) {
      console.error("Error assigning full permissions:", error);
      toast.error("Failed to assign full permissions");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!role) return;

    try {
      setIsSaving(true);
      const permissionIds = Array.from(selectedPermissions);

      const response = await fetch(`/api/role/${role.id}/permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ permissionIds }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || "Permissions updated successfully");
        await fetchPermissions();
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to update permissions");
      }
    } catch (error: any) {
      console.error("Error saving permissions:", error);
      toast.error("Failed to save permissions");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPermissions = permissions.filter((perm) =>
    perm.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const expectedPermissions = filteredPermissions.filter((p) => p.expected);
  const otherPermissions = filteredPermissions.filter((p) => !p.expected);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Permissions - {role?.name}
          </DialogTitle>
          <DialogDescription>
            {isAdminRole
              ? "Admin roles automatically have all permissions and cannot be modified."
              : "Assign or remove permissions for this role. Click 'Assign Full' to automatically assign all permissions based on the role type."}
          </DialogDescription>
        </DialogHeader>

        {isAdminRole && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Admin Role Detected
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Admin roles must have all permissions. Individual permission
                  selection is disabled.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPermissions}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            {!isAdminRole && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAssignFull}
                disabled={isSaving}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Assign Full
              </Button>
            )}
          </div>
        </div>

        {/* Permission Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant={hasFullPermissions ? "default" : "secondary"}>
              {hasFullPermissions ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Full Permissions
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Partial Permissions
                </>
              )}
            </Badge>
          </div>
          <span className="text-muted-foreground">
            {assignedCount} / {expectedCount} expected permissions assigned
          </span>
        </div>

        <ScrollArea className="flex-1 min-h-[400px] border rounded-lg p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading permissions...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Expected Permissions */}
              {expectedPermissions.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                    Expected Permissions ({expectedPermissions.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {expectedPermissions.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50"
                      >
                        <Checkbox
                          id={perm.id}
                          checked={selectedPermissions.has(perm.id)}
                          onCheckedChange={() =>
                            handleTogglePermission(perm.id)
                          }
                          disabled={isAdminRole}
                        />
                        <label
                          htmlFor={perm.id}
                          className={`text-sm flex-1 cursor-pointer ${
                            isAdminRole ? "cursor-not-allowed opacity-50" : ""
                          }`}
                        >
                          {perm.name}
                        </label>
                        {perm.assigned && (
                          <Badge variant="outline" className="text-xs">
                            Assigned
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Permissions */}
              {otherPermissions.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                    Additional Permissions ({otherPermissions.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {otherPermissions.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50"
                      >
                        <Checkbox
                          id={perm.id}
                          checked={selectedPermissions.has(perm.id)}
                          onCheckedChange={() =>
                            handleTogglePermission(perm.id)
                          }
                          disabled={isAdminRole}
                        />
                        <label
                          htmlFor={perm.id}
                          className={`text-sm flex-1 cursor-pointer ${
                            isAdminRole ? "cursor-not-allowed opacity-50" : ""
                          }`}
                        >
                          {perm.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredPermissions.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  No permissions found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {!isAdminRole && (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Permissions"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

