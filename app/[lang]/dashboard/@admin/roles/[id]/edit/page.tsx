"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Shield, Save, ArrowLeft, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store";

interface PermissionData {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  category?: string;
}

interface RoleData {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  isSystem?: boolean;
  permissions: string[];
}

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;

  const {
    user,
    isAuthenticated,
    initialized,
    initialize,
    hasRole,
    role: userRole,
  } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [permissions, setPermissions] = useState<PermissionData[]>([]);
  const [role, setRole] = useState<RoleData | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    displayName: "",
    description: "",
  });

  useEffect(() => {
    // Initialize auth store from localStorage
    if (!initialized) {
      initialize();
      return;
    }

    // Check authentication after initialization
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    // Check if user has admin role (case-insensitive check)
    // The store's hasRole method handles case-insensitive comparison
    // Check multiple possible admin role formats: "admin", "ADMIN", "Administrator"
    const isAdmin =
      hasRole("admin") ||
      hasRole("ADMIN") ||
      hasRole("Administrator") ||
      userRole?.toLowerCase() === "admin" ||
      userRole?.toLowerCase() === "administrator" ||
      user?.role?.toLowerCase() === "admin" ||
      user?.role?.toLowerCase() === "administrator";

    if (!isAdmin) {
      toast.error("Access denied. Only admins can edit roles.");
      router.push("/dashboard");
      return;
    }

    fetchData();
  }, [
    router,
    roleId,
    isAuthenticated,
    user,
    initialized,
    initialize,
    hasRole,
    userRole,
  ]);

  const fetchData = async () => {
    try {
      setFetchingData(true);
      const response = await fetch("/api/roles?includePermissions=true");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      // Handle API response format
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch role data");
      }

      // Extract roles and permissions from response
      const roles = data.roles || data.data || [];
      const permissions = data.permissions || [];

      const roleData = roles.find((r: RoleData) => r.id === roleId);

      if (!roleData) {
        toast.error("Role not found");
        router.push("/dashboard/roles");
        return;
      }

      // Process permissions to add missing fields
      const processedPermissions = permissions.map((perm: any) => ({
        ...perm,
        displayName:
          perm.displayName ||
          perm.name
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l: string) => l.toUpperCase()),
        description:
          perm.description || `Permission to ${perm.name.replace(/_/g, " ")}`,
        category: getCategoryFromPermissionName(perm.name),
      }));

      setRole(roleData);
      setPermissions(processedPermissions);
      setSelectedPermissions(roleData.permissions || []);
      setFormData({
        displayName:
          roleData.displayName ||
          roleData.name
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l: string) => l.toUpperCase()),
        description: roleData.description || `Role: ${roleData.name}`,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load role data");
    } finally {
      setFetchingData(false);
    }
  };

  // Helper function to determine category from permission name
  const getCategoryFromPermissionName = (name: string): string => {
    if (name.includes("user") || name.includes("role")) return "Users";
    if (name.includes("school")) return "Schools";
    if (
      name.includes("teacher") ||
      name.includes("student") ||
      name.includes("parent")
    )
      return "Academic";
    if (name.includes("attendance")) return "Attendance";
    if (name.includes("message") || name.includes("chat"))
      return "Communication";
    if (
      name.includes("dashboard") ||
      name.includes("report") ||
      name.includes("setting")
    )
      return "System";
    return "System";
  };

  const handleTogglePermission = (permissionName: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionName)
        ? prev.filter((p) => p !== permissionName)
        : [...prev, permissionName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.displayName) {
      toast.error("Please fill in the display name");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/roles?id=${roleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: role?.name, // Keep the original name
          displayName: formData.displayName,
          description: formData.description,
          permissions: selectedPermissions,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update role");
      }

      toast.success("Role updated successfully");
      router.push("/roles");
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    } finally {
      setLoading(false);
    }
  };

  // Group permissions by category
  const permissionsByCategory = permissions.reduce((acc, permission) => {
    const category = permission.category || "System";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, PermissionData[]>);

  if (!initialized || !user || fetchingData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!role) {
    return null;
  }

  return (
    <PermissionGuard permission="roles_manage">
      <div className="space-y-6">
        <PageHeader
          title={`Edit Role: ${role.displayName || role.name}`}
          description="Update role information and permissions"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Roles", href: "/roles" },
            { label: "Edit Role" },
          ]}
          actions={
            <Link href="/roles">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Roles
              </Button>
            </Link>
          }
        />

        {role.isSystem && (
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-400">
                    System Role
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    This is a system role. You can modify permissions and
                    description, but the role name cannot be changed or deleted.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Role Information</CardTitle>
              <CardDescription>Basic details about the role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Role Name (Slug)</Label>
                <div className="flex items-center gap-2">
                  <Input value={role.name} disabled className="bg-muted" />
                  {role.isSystem && (
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      System
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Role identifier cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  placeholder="e.g., Principal, Librarian, Counselor"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this role does and what access they have..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Permissions Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Manage Permissions</CardTitle>
              <CardDescription>
                Update the permissions this role should have (
                {selectedPermissions.length} selected)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(permissionsByCategory).map(
                  ([category, categoryPerms]) => (
                    <div key={category} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">{category}</h3>
                        <span className="text-sm text-muted-foreground">
                          (
                          {
                            categoryPerms.filter((p) =>
                              selectedPermissions.includes(p.name)
                            ).length
                          }
                          /{categoryPerms.length})
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-7">
                        {categoryPerms.map((permission) => (
                          <div
                            key={permission.id}
                            className={`flex items-start space-x-3 p-4 border rounded-lg transition-colors ${
                              selectedPermissions.includes(permission.name)
                                ? "bg-primary/5 border-primary/30"
                                : "hover:bg-accent/50"
                            }`}
                          >
                            <Checkbox
                              id={permission.id}
                              checked={selectedPermissions.includes(
                                permission.name
                              )}
                              onCheckedChange={() =>
                                handleTogglePermission(permission.name)
                              }
                              className="mt-1 border-2 border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <div className="flex-1">
                              <Label
                                htmlFor={permission.id}
                                className="font-medium cursor-pointer"
                              >
                                {permission.displayName}
                              </Label>
                              <p className="text-sm text-muted-foreground mt-1">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {Object.keys(permissionsByCategory).indexOf(category) <
                        Object.keys(permissionsByCategory).length - 1 && (
                        <Separator />
                      )}
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Link href="/roles">
              <Button type="button" variant="outline" disabled={loading}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Role
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </PermissionGuard>
  );
}
