"use client";

import { useEffect, useState } from "react";
import { Staff } from "./_types";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  User,
  Loader2,
  RefreshCw,
  Search,
  X,
  Edit,
  Trash2,
  MoreVertical,
  Phone,
  Shield,
  Building2,
} from "lucide-react";
import { useStaffStore } from "./_store/staff-store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { useRouter, useParams } from "next/navigation";
import useTranslation from "@/hooks/useTranslation";

export default function StaffPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params.lang || "en";
  const [userOfficeId, setUserOfficeId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");

  // Get state and actions from Zustand store
  const {
    staff,
    isLoading,
    isSubmitting,
    isDeleteDialogOpen,
    selectedStaff,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    searchTerm,
    fetchStaff,
    refreshStaff,
    deleteStaff,
    setDeleteDialogOpen,
    setSelectedStaff,
    setPage,
    setPageSize,
    setSearchTerm,
  } = useStaffStore();

  // Fetch staff on mount (API will automatically filter by user's office)
  useEffect(() => {
    fetchStaff(1, pageSize, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Extract officeId from staff once loaded
  useEffect(() => {
    if (staff.length > 0 && !userOfficeId) {
      const firstStaff = staff[0];
      if (firstStaff?.officeId) {
        setUserOfficeId(firstStaff.officeId);
      }
    }
  }, [staff, userOfficeId]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchTerm) {
        setSearchTerm(searchInput);
        fetchStaff(1, pageSize, searchInput);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle edit - redirect to edit page
  const handleEdit = (staff: Staff) => {
    router.push(`/${lang}/dashboard/staff/${staff.id}/edit`);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedStaff?.id) return;
    await deleteStaff(selectedStaff.id);
  };

  // Handle create new - redirect to add page
  const handleCreateNew = () => {
    router.push(`/${lang}/dashboard/staff/add`);
  };

  // Handle delete click
  const handleDeleteClick = (staff: Staff) => {
    setSelectedStaff(staff);
    setDeleteDialogOpen(true);
  };

  // Generate pagination items
  const getPaginationItems = () => {
    const items = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      items.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        end = Math.min(4, totalPages - 1);
      }

      if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - 3);
      }

      if (start > 2) {
        items.push("ellipsis-start");
      }

      for (let i = start; i <= end; i++) {
        items.push(i);
      }

      if (end < totalPages - 1) {
        items.push("ellipsis-end");
      }

      if (totalPages > 1) {
        items.push(totalPages);
      }
    }

    return items;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("navigation.staff")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("dashboard.manageStaffInOffice")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("dashboard.searchByUsernamePhone")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => {
              fetchStaff(currentPage, pageSize, searchTerm);
            }}
            disabled={isLoading}
            size="sm"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            {t("common.refresh")}
          </Button>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            {t("dashboard.addStaff")}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t("dashboard.show")}:
          </span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(parseInt(value));
              fetchStaff(1, parseInt(value), searchTerm);
            }}
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

      {/* Staff Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">{t("dashboard.loadingStaff")}</p>
        </div>
      ) : staff.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/30 rounded-lg border border-dashed">
          <User className="w-20 h-20 text-muted-foreground mb-6" />
          <h3 className="text-xl font-semibold mb-2">
            {t("dashboard.noStaffFound")}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            {searchTerm
              ? t("dashboard.noStaffMatchSearch")
              : t("dashboard.getStartedAddStaff")}
          </p>
          {!searchTerm && (
            <Button onClick={handleCreateNew} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              {t("dashboard.addYourFirstStaff")}
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("dashboard.staff")}</TableHead>
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
                {staff.map((staffMember) => {
                  const initials = staffMember.username
                    ? staffMember.username.substring(0, 2).toUpperCase()
                    : "ST";
                  return (
                    <TableRow key={staffMember.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <div className="font-medium">
                              {staffMember.username}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{staffMember.phoneNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {staffMember.role ? (
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1 w-fit"
                          >
                            <Shield className="h-3 w-3" />
                            {staffMember.role.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {t("dashboard.noRole")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {staffMember.office ? (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 w-fit"
                          >
                            <Building2 className="h-3 w-3" />
                            {staffMember.office.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {t("dashboard.noOffice")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            staffMember.isActive ? "default" : "destructive"
                          }
                          className="w-fit"
                        >
                          {staffMember.isActive
                            ? t("dashboard.active")
                            : t("dashboard.inactive")}
                        </Badge>
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
                              onClick={() => handleEdit(staffMember)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              {t("common.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(staffMember)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("common.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {t("dashboard.showing")} {(currentPage - 1) * pageSize + 1}{" "}
                {t("dashboard.to")}{" "}
                {Math.min(currentPage * pageSize, totalItems)}{" "}
                {t("dashboard.of")} {totalItems} {t("dashboard.staff")}
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => {
                        const newPage = Math.max(1, currentPage - 1);
                        setPage(newPage);
                        fetchStaff(newPage, pageSize, searchTerm);
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {getPaginationItems().map((item, index) => {
                    if (item === "ellipsis-start" || item === "ellipsis-end") {
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
                          onClick={() => {
                            setPage(pageNum);
                            fetchStaff(pageNum, pageSize, searchTerm);
                          }}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => {
                        const newPage = Math.min(totalPages, currentPage + 1);
                        setPage(newPage);
                        fetchStaff(newPage, pageSize, searchTerm);
                      }}
                      className={
                        currentPage === totalPages
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.areYouSure")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.deleteStaffConfirm").replace(
                "{username}",
                selectedStaff?.username || ""
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
    </div>
  );
}
