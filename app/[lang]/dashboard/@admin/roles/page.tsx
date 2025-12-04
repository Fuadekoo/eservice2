"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Plus, RefreshCw, Users, Lock } from "lucide-react";
import { useRoleStore } from "./_store/role-store";
import { RolesTable } from "./_components/roles-table";
import { useTranslation } from "@/lib/utils/translation";
import { toast } from "sonner";

export default function RolesPage() {
  const { t } = useTranslation();
  const {
    roles,
    isLoading,
    fetchRoles,
    refreshRoles,
    deleteRole,
    getSystemRoles,
    getCustomRoles,
  } = useRoleStore();

  const [filter, setFilter] = useState<"all" | "system" | "custom">("all");

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const systemRoles = getSystemRoles();
  const customRoles = getCustomRoles();

  const filteredRoles =
    filter === "all"
      ? roles
      : filter === "system"
      ? systemRoles
      : customRoles;

  const handleRefresh = async () => {
    await refreshRoles();
    toast.success(
      t("Roles refreshed successfully") || "Roles refreshed successfully"
    );
  };

  const handleDelete = async (id: string) => {
    const success = await deleteRole(id);
    if (success) {
      await refreshRoles();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Roles") || "Roles"}
        description={
          t("Manage user roles and access levels") ||
          "Manage user roles and access levels"
        }
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              {t("Refresh") || "Refresh"}
            </Button>
            <Link href="/dashboard/roles/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("Create Role") || "Create Role"}
              </Button>
            </Link>
          </div>
        }
      />

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setFilter("all")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {t("Total Roles") || "Total Roles"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {systemRoles.length} {t("system") || "system"}, {customRoles.length}{" "}
              {t("custom") || "custom"}
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setFilter("system")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {t("System Roles") || "System Roles"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemRoles.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("Protected from deletion") || "Protected from deletion"}
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setFilter("custom")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {t("Custom Roles") || "Custom Roles"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customRoles.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("Created by administrators") || "Created by administrators"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Filter */}
      {filter !== "all" && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {t("Filtering by") || "Filtering by"}:{" "}
                  {filter === "system"
                    ? t("System Roles") || "System Roles"
                    : t("Custom Roles") || "Custom Roles"}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilter("all")}
              >
                {t("Clear Filter") || "Clear Filter"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("All Roles") || "All Roles"} ({filteredRoles.length})
          </CardTitle>
          <CardDescription>
            {t("View and manage all roles in the system") ||
              "View and manage all roles in the system"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RolesTable
            roles={filteredRoles}
            loading={isLoading}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800 dark:text-blue-400">
                {t("About Roles") || "About Roles"}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                {t(
                  "Roles define what users can do in the system. Each role can have multiple permissions assigned. System roles (like ADMIN) cannot be deleted and are protected. Custom roles can be created and managed by administrators."
                ) ||
                  "Roles define what users can do in the system. Each role can have multiple permissions assigned. System roles (like ADMIN) cannot be deleted and are protected. Custom roles can be created and managed by administrators."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
