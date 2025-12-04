"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Shield, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/utils/translation";
import { usePermissionStore } from "@/app/[domain]/manager/permissions/_store/permission-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOfficeStore } from "@/app/admin/office/_store/office-store";

interface PermissionData {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  category?: string;
}

export default function CreateRolePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { permissions, fetchPermissions, getCategories } = usePermissionStore();
  const { offices, fetchOffices } = useOfficeStore();

  const [loading, setLoading] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    officeId: undefined as string | undefined,
  });

  useEffect(() => {
    fetchPermissions();
    fetchOffices();
  }, [fetchPermissions, fetchOffices]);

  // Process permissions for display
  const processedPermissions: PermissionData[] = permissions.map((perm) => ({
    id: perm.id,
    name: perm.name,
    displayName:
      perm.displayName ||
      perm.name
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l: string) => l.toUpperCase()),
    description:
      perm.description || `Permission to ${perm.name.replace(/_/g, " ")}`,
    category: perm.category || "System",
  }));

  // Group permissions by category
  const permissionsByCategory = processedPermissions.reduce(
    (acc, permission) => {
      const category = permission.category || "System";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    },
    {} as Record<string, PermissionData[]>
  );

  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((p) => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error(
        t("Please fill in all required fields") ||
          "Please fill in all required fields"
      );
      return;
    }

    if (selectedPermissions.length === 0) {
      toast.error(
        t("Please select at least one permission") ||
          "Please select at least one permission"
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.toUpperCase(),
          officeId: formData.officeId || null,
          permissionIds: selectedPermissions,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create role");
      }

      toast.success(
        t("Role created successfully") || "Role created successfully"
      );
      router.push("/dashboard/roles");
    } catch (error: any) {
      toast.error(
        error.message || t("Failed to create role") || "Failed to create role"
      );
    } finally {
      setLoading(false);
    }
  };

  const categories = getCategories();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Create New Role") || "Create New Role"}
        description={
          t("Define a custom role with specific permissions") ||
          "Define a custom role with specific permissions"
        }
        actions={
          <Link href="/dashboard/roles">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("Back to Roles") || "Back to Roles"}
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Role Information") || "Role Information"}</CardTitle>
            <CardDescription>
              {t("Basic details about the role") ||
                "Basic details about the role"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("Role Name") || "Role Name"} *</Label>
                <Input
                  id="name"
                  placeholder="e.g., MANAGER, SECRETARY"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                    })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t("Uppercase letters and underscores only") ||
                    "Uppercase letters and underscores only"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="officeId">
                  {t("Office") || "Office"} ({t("Optional") || "Optional"})
                </Label>
                <Select
                  value={formData.officeId || "__none__"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      officeId: value === "__none__" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        t(
                          "Select an office (or leave empty for platform role)"
                        ) ||
                        "Select an office (or leave empty for platform role)"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      {t("Platform Role") || "Platform Role"} (
                      {t("No Office") || "No Office"})
                    </SelectItem>
                    {offices.map((office) => (
                      <SelectItem key={office.id} value={office.id}>
                        {office.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t("Leave empty for platform-level roles") ||
                    "Leave empty for platform-level roles"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissions Selection */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("Assign Permissions") || "Assign Permissions"}
            </CardTitle>
            <CardDescription>
              {t("Select the permissions this role should have") ||
                "Select the permissions this role should have"}{" "}
              ({selectedPermissions.length} {t("selected") || "selected"})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {categories.length > 0 ? (
                categories.map((category) => {
                  const categoryPerms = permissionsByCategory[category] || [];
                  if (categoryPerms.length === 0) return null;

                  return (
                    <div key={category} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">{category}</h3>
                        <span className="text-sm text-muted-foreground">
                          (
                          {
                            categoryPerms.filter((p) =>
                              selectedPermissions.includes(p.id)
                            ).length
                          }
                          /{categoryPerms.length})
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-7">
                        {categoryPerms.map((permission) => (
                          <div
                            key={permission.id}
                            className={`flex items-start space-x-4 p-4 border-2 rounded-lg transition-all cursor-pointer ${
                              selectedPermissions.includes(permission.id)
                                ? "bg-blue-50 border-blue-300 shadow-sm dark:bg-blue-950/20"
                                : "border-gray-200 hover:bg-gray-50 hover:border-gray-300 dark:border-gray-700 dark:hover:bg-gray-800"
                            }`}
                            onClick={() =>
                              handleTogglePermission(permission.id)
                            }
                          >
                            <Checkbox
                              id={permission.id}
                              checked={selectedPermissions.includes(
                                permission.id
                              )}
                              onCheckedChange={() =>
                                handleTogglePermission(permission.id)
                              }
                              className="mt-1"
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

                      {categories.indexOf(category) < categories.length - 1 && (
                        <Separator />
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {t("No permissions available") || "No permissions available"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Link href="/dashboard/roles">
            <Button type="button" variant="outline" disabled={loading}>
              {t("Cancel") || "Cancel"}
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                {t("Creating...") || "Creating..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t("Create Role") || "Create Role"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
