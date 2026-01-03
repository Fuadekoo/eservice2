"use client";

import { useEffect } from "react";
import { useRequestManagementStore } from "./_store/request-management-store";
import { RequestDetail } from "./_components/request-detail";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Loader2,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  FileText,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { format } from "date-fns";
import { toast } from "sonner";
import { calculateOverallStatus } from "@/lib/request-status";
import useTranslation from "@/hooks/useTranslation";

export default function RequestManagementPage() {
  const { t } = useTranslation();
  const {
    requests,
    offices,
    selectedRequest,
    isLoading,
    isDetailOpen,
    page,
    pageSize,
    total,
    totalPages,
    search,
    officeId,
    status,
    fetchRequests,
    fetchOffices,
    setPage,
    setPageSize,
    setSearch,
    setOfficeId,
    setStatus,
    setDetailOpen,
    fetchRequestById,
  } = useRequestManagementStore();

  useEffect(() => {
    fetchOffices();
    fetchRequests();
  }, [fetchOffices, fetchRequests]);

  const handleViewDetails = async (request: any) => {
    try {
      await fetchRequestById(request.id);
      setDetailOpen(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to load request details");
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" />
            {t("dashboard.approved")}
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="destructive"
            className="flex items-center gap-1 w-fit"
          >
            <XCircle className="w-3 h-3" />
            {t("dashboard.rejected")}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" />
            {t("dashboard.pending")}
          </Badge>
        );
    }
  };

  const getStaffApproval = (request: any) => {
    const hasStaffApproval = !!request.approveStaff;

    if (hasStaffApproval) {
      return (
        <Badge variant="default" className="text-xs bg-green-600">
          {t("dashboard.done")}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs">
        {t("dashboard.pending")}
      </Badge>
    );
  };

  const getManagerApproval = (request: any) => {
    const hasManagerApproval = !!request.approveManager;

    if (hasManagerApproval) {
      return (
        <Badge variant="default" className="text-xs bg-blue-600">
          {t("dashboard.done")}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs">
        {t("dashboard.pending")}
      </Badge>
    );
  };

  return (
    <div className="w-full overflow-y-auto py-6 space-y-8 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("navigation.requestManagement")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("dashboard.viewAndManageAllRequests")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {t("dashboard.perPage")}
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                const ps = parseInt(value);
                setPageSize(ps);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-24 h-8">
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

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("dashboard.searchRequests")}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={officeId || "all"}
              onValueChange={(value) =>
                setOfficeId(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder={t("dashboard.allOffices")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("dashboard.allOffices")}</SelectItem>
                {offices.map((office) => (
                  <SelectItem key={office.id} value={office.id}>
                    {office.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={status || "all"}
              onValueChange={(value) => setStatus(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder={t("dashboard.allStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("dashboard.allStatus")}</SelectItem>
                <SelectItem value="pending">
                  {t("dashboard.pending")}
                </SelectItem>
                <SelectItem value="approved">
                  {t("dashboard.approved")}
                </SelectItem>
                <SelectItem value="rejected">
                  {t("dashboard.rejected")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-1 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">
                {t("dashboard.noRequestsFound")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || officeId || status
                  ? t("dashboard.tryAdjustingFilters")
                  : t("dashboard.noRequestsSubmittedYet")}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">
                        {t("dashboard.customer")}
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm">
                        {t("dashboard.service")}
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm hidden md:table-cell">
                        {t("navigation.office")}
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm whitespace-nowrap">
                        {t("common.date")}
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm">
                        {t("common.status")}
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm">
                        {t("dashboard.staffApproval")}
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm">
                        {t("dashboard.managerApproval")}
                      </TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">
                        {t("common.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {request.user.username}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {request.user.phoneNumber}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {request.service.name}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs sm:max-w-md">
                              {request.service.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm">
                                {request.service.office.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Room {request.service.office.roomNumber}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div>
                            <p className="text-sm">
                              {format(new Date(request.date), "MMM dd, yyyy")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(request.createdAt), "MMM dd")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(
                            calculateOverallStatus(
                              request.statusbystaff,
                              request.statusbyadmin
                            )
                          )}
                        </TableCell>
                        <TableCell>{getStaffApproval(request)}</TableCell>
                        <TableCell>{getManagerApproval(request)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(request)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {total > 0 &&
                (() => {
                  const derivedTotalPages = Math.max(
                    1,
                    Math.ceil(total / pageSize)
                  );
                  return (
                    <div className="px-4 py-3 border-t sticky bottom-0 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-muted-foreground">
                          {t("dashboard.showing")} {(page - 1) * pageSize + 1}{" "}
                          {t("dashboard.to")} {Math.min(page * pageSize, total)}{" "}
                          {t("dashboard.of")} {total} {t("dashboard.requests")}
                        </div>
                        <div className="flex items-center gap-4">
                          {derivedTotalPages > 1 && (
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious
                                    onClick={() =>
                                      page > 1 && setPage(page - 1)
                                    }
                                    className={
                                      page === 1 || isLoading
                                        ? "pointer-events-none opacity-50"
                                        : "cursor-pointer"
                                    }
                                  />
                                </PaginationItem>
                                {Array.from(
                                  { length: derivedTotalPages },
                                  (_, i) => i + 1
                                ).map((pageNum) => {
                                  if (
                                    pageNum === 1 ||
                                    pageNum === derivedTotalPages ||
                                    (pageNum >= page - 1 && pageNum <= page + 1)
                                  ) {
                                    return (
                                      <PaginationItem key={pageNum}>
                                        <PaginationLink
                                          onClick={() => setPage(pageNum)}
                                          isActive={pageNum === page}
                                          className="cursor-pointer"
                                        >
                                          {pageNum}
                                        </PaginationLink>
                                      </PaginationItem>
                                    );
                                  } else if (
                                    pageNum === page - 2 ||
                                    pageNum === page + 2
                                  ) {
                                    return (
                                      <PaginationItem key={pageNum}>
                                        <PaginationEllipsis />
                                      </PaginationItem>
                                    );
                                  }
                                  return null;
                                })}
                                <PaginationItem>
                                  <PaginationNext
                                    onClick={() =>
                                      page < derivedTotalPages &&
                                      setPage(page + 1)
                                    }
                                    className={
                                      page === derivedTotalPages || isLoading
                                        ? "pointer-events-none opacity-50"
                                        : "cursor-pointer"
                                    }
                                  />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          )}
                          {/* Per-page selector moved to header to avoid duplication */}
                        </div>
                      </div>
                    </div>
                  );
                })()}
            </>
          )}
          {/* </CardContent> */}
        </Card>
      </div>

      {/* Request Detail Dialog */}
      <RequestDetail
        request={selectedRequest}
        open={isDetailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
