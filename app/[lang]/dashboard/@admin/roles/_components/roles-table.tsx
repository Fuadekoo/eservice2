"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Shield, Search, Edit, Trash2, Users } from "lucide-react";
import { Role } from "../_types";

interface RolesTableProps {
  roles: Role[];
  loading?: boolean;
  onDelete?: (id: string) => void;
}

export function RolesTable({ roles, loading, onDelete }: RolesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRoles = useMemo(() => {
    if (!searchTerm) return roles;

    const term = searchTerm.toLowerCase();
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(term) ||
        role.office?.name?.toLowerCase().includes(term)
    );
  }, [roles, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Role Name</TableHead>
              <TableHead>Office</TableHead>
              <TableHead className="w-[120px]">Permissions</TableHead>
              <TableHead className="w-[100px]">Users</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead className="w-[150px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  {searchTerm
                    ? "No roles found matching your search."
                    : "No roles available."}
                </TableCell>
              </TableRow>
            ) : (
              filteredRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">{role.name}</div>
                        {role.office && (
                          <div className="text-xs text-muted-foreground">
                            {role.office.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {role.office ? (
                      <Badge variant="outline">{role.office.name}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Platform
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {role.permissionCount || 0} permissions
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {role.userCount || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {role.isSystem ? (
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300"
                      >
                        System
                      </Badge>
                    ) : (
                      <Badge variant="outline">Custom</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Link href={`/dashboard/roles/${role.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      {!role.isSystem && onDelete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Role</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the role "
                                {role.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete(role.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

