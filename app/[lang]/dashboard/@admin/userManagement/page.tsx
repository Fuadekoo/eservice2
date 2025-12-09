"use client";

import { useEffect, useState } from "react";
import { User } from "./_types";
import { UserFormValues } from "./_schema";
import { UserForm } from "./_components/user-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Users as UsersIcon,
  Loader2,
  RefreshCw,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  Building2,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useUserStore } from "./_store";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import useTranslation from "@/hooks/useTranslation";

export default function UserManagementPage() {
  const { t } = useTranslation();
  // Get state and actions from Zustand store
  const {
    users,
    roles,
    isLoading,
    isSubmitting,
    isFormOpen,
    isDeleteDialogOpen,
    isStatusDialogOpen,
    selectedUser,
    page,
    pageSize,
    total,
    totalPages,
    search,
    roleId,
    fetchUsers,
    fetchRoles,
    refreshUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    setFormOpen,
    setDeleteDialogOpen,
    setStatusDialogOpen,
    setSelectedUser,
    setPage,
    setPageSize,
    setSearch,
    setRoleId,
  } = useUserStore();

  // Local search state for debouncing
  const [searchInput, setSearchInput] = useState(search);

  // Fetch users and roles on mount
  useEffect(() => {
    fetchUsers();
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchUsers is stable from Zustand store

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput);
        fetchUsers({ page: 1, pageSize, search: searchInput, roleId });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle form submission
  const handleSubmit = async (data: UserFormValues) => {
    if (selectedUser) {
      // For updates, only include password if provided
      const updateData: Partial<UserFormValues> = {
        name: data.name,
        phoneNumber: data.phoneNumber,
        email: data.email,
        roleId: data.roleId,
        officeId: data.officeId,
        username: data.username,
      };

      // Only include password if it's provided
      if (data.password && data.password.trim() !== "") {
        updateData.password = data.password;
      }

      await updateUser(selectedUser.id, updateData);
    } else {
      await createUser(data);
    }
  };

  // Handle edit
  const handleEdit = (user: User) => {
    console.log("✏️ Editing user:", user);
    setSelectedUser(user);
    setFormOpen(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedUser?.id) return;
    await deleteUser(selectedUser.id);
  };

  // Handle create new
  const handleCreateNew = () => {
    setSelectedUser(null);
    setFormOpen(true);
  };

  // Check if user is admin
  const isAdmin = (user: User) => {
    const roleName = user.role?.name?.toLowerCase() || "";
    return roleName === "admin" || roleName === "administrator";
  };

  // Handle delete click
  const handleDeleteClick = (user: User) => {
    // Prevent deletion of admin users
    if (isAdmin(user)) {
      toast.error(t("dashboard.cannotDeleteAdminUsers"));
      return;
    }
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  // Handle toggle status click
  const handleToggleStatusClick = (user: User) => {
    setSelectedUser(user);
    setStatusDialogOpen(true);
  };

  // Handle toggle status confirmation
  const handleToggleStatusConfirm = async () => {
    if (!selectedUser?.id) {
      setStatusDialogOpen(false);
      return;
    }

    const newStatus = !selectedUser.isActive;
    await toggleUserStatus(selectedUser.id, newStatus);
  };

  // Get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate pagination items
  const getPaginationItems = () => {
    const items = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      // Show first page
      items.push(1);

      // Calculate start and end
      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);

      // Adjust if near start
      if (page <= 3) {
        end = Math.min(4, totalPages - 1);
      }

      // Adjust if near end
      if (page >= totalPages - 2) {
        start = Math.max(2, totalPages - 3);
      }

      // Add ellipsis after first if needed
      if (start > 2) {
        items.push("ellipsis-start");
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        items.push(i);
      }

      // Add ellipsis before last if needed
      if (end < totalPages - 1) {
        items.push("ellipsis-end");
      }

      // Show last page
      if (totalPages > 1) {
        items.push(totalPages);
      }
    }

    return items;
  };

  return (
    <div className="h-dvh overflow-y-auto">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("dashboard.userManagement")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("dashboard.manageUsersDescription")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={refreshUsers}
              disabled={isLoading}
              size="sm"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              {t("common.refresh")}
            </Button>
            <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t("dashboard.addUser")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {selectedUser
                      ? t("dashboard.editUser")
                      : t("dashboard.createNewUser")}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedUser
                      ? t("dashboard.updateUserInfo")
                      : t("dashboard.createUserDescription")}
                  </DialogDescription>
                </DialogHeader>
                <UserForm
                  user={selectedUser}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setFormOpen(false);
                    setSelectedUser(null);
                  }}
                  isLoading={isSubmitting}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("dashboard.searchUsers")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={roleId || "all"}
            onValueChange={(value) => setRoleId(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("dashboard.allRoles")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("dashboard.allRoles")}</SelectItem>
              <SelectItem value="manager">All Managers</SelectItem>
              <SelectItem value="staff">All Staff</SelectItem>
              <SelectItem value="admin">All Admins</SelectItem>
              <SelectItem value="customer">All Customers</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t("dashboard.show")}:
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => setPageSize(parseInt(value))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">
              {t("dashboard.loadingUsers")}
            </p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/30 rounded-lg border border-dashed">
            <UsersIcon className="w-20 h-20 text-muted-foreground mb-6" />
            <h3 className="text-xl font-semibold mb-2">
              {t("dashboard.noUsersFound")}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {search
                ? t("dashboard.noUsersMatchSearch")
                : t("dashboard.getStartedCreateUser")}
            </p>
            {!search && (
              <Button onClick={handleCreateNew} size="lg">
                <Plus className="w-5 h-5 mr-2" />
                {t("dashboard.addYourFirstUser")}
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-hidden">
              <div className="h-dvh overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("dashboard.user")}</TableHead>
                      <TableHead>{t("dashboard.contact")}</TableHead>
                      <TableHead>{t("dashboard.role")}</TableHead>
                      <TableHead>{t("dashboard.office")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead className="text-right">
                        {t("common.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const initials = getInitials(
                        user.name || user.username || "U"
                      );
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={user.image || undefined}
                                  alt={user.name || user.username || "User"}
                                />
                                <AvatarFallback>{initials}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <div className="font-medium">
                                  {user.name || user.username || "N/A"}
                                </div>
                                {user.username && (
                                  <div className="text-sm text-muted-foreground">
                                    @{user.username}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {user.email && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate max-w-[200px]">
                                    {user.email}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span>{user.phoneNumber}</span>
                                {user.phoneNumberVerified && (
                                  <Badge variant="outline" className="text-xs">
                                    {t("dashboard.verified")}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.role ? (
                              <Badge
                                variant="secondary"
                                className="flex items-center gap-1 w-fit"
                              >
                                <Shield className="h-3 w-3" />
                                {user.role.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                {t("dashboard.noRole")}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.office ? (
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1 w-fit"
                              >
                                <Building2 className="h-3 w-3" />
                                {user.office.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                {t("dashboard.noOffice")}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge
                                variant={
                                  user.isActive === true
                                    ? "default"
                                    : "secondary"
                                }
                                className="w-fit text-xs flex items-center gap-1"
                              >
                                {user.isActive === true ? (
                                  <CheckCircle className="h-3 w-3" />
                                ) : (
                                  <XCircle className="h-3 w-3" />
                                )}
                                {user.isActive === true
                                  ? t("dashboard.active")
                                  : t("dashboard.inactive")}
                              </Badge>
                              {user.emailVerified && (
                                <Badge
                                  variant="outline"
                                  className="w-fit text-xs"
                                >
                                  {t("dashboard.emailVerified")}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEdit(user)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  {t("common.edit")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleStatusClick(user)}
                                >
                                  {user.isActive ? (
                                    <>
                                      <XCircle className="mr-2 h-4 w-4" />
                                      {t("dashboard.inactive")}
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      {t("dashboard.active")}
                                    </>
                                  )}
                                </DropdownMenuItem>
                                {!isAdmin(user) && (
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteClick(user)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t("common.delete")}
                                  </DropdownMenuItem>
                                )}
                                {isAdmin(user) && (
                                  <DropdownMenuItem
                                    disabled
                                    className="text-muted-foreground cursor-not-allowed"
                                  >
                                    <Shield className="mr-2 h-4 w-4" />
                                    {t("dashboard.cannotDeleteAdmin")}
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {t("dashboard.showing")} {(page - 1) * pageSize + 1}{" "}
                  {t("dashboard.to")} {Math.min(page * pageSize, total)}{" "}
                  {t("dashboard.of")} {total} {t("dashboard.users")}
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage(Math.max(1, page - 1))}
                        className={
                          page === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {getPaginationItems().map((item, index) => {
                      if (
                        item === "ellipsis-start" ||
                        item === "ellipsis-end"
                      ) {
                        return (
                          <PaginationItem key={`ellipsis-${index}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      const pageNum = item as number;
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setPage(pageNum)}
                            isActive={page === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        className={
                          page === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}

        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("dashboard.areYouSure")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("dashboard.deleteUserConfirm").replace(
                  "{name}",
                  selectedUser?.name || selectedUser?.username || ""
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>
                {t("common.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isSubmitting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isSubmitting ? t("dashboard.deleting") : t("common.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Status Toggle Confirmation Dialog */}
        <AlertDialog
          open={isStatusDialogOpen}
          onOpenChange={setStatusDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("dashboard.changeUserStatus")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {selectedUser && (
                  <>
                    {selectedUser.isActive
                      ? t("dashboard.deactivateUserConfirm").replace(
                          "{name}",
                          selectedUser.name || selectedUser.username || ""
                        )
                      : t("dashboard.activateUserConfirm").replace(
                          "{name}",
                          selectedUser.name || selectedUser.username || ""
                        )}
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={isSubmitting}
                onClick={() => setSelectedUser(null)}
              >
                {t("common.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleToggleStatusConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? selectedUser?.isActive
                    ? t("dashboard.deactivating")
                    : t("dashboard.activating")
                  : selectedUser?.isActive
                  ? t("dashboard.inactive")
                  : t("dashboard.active")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
