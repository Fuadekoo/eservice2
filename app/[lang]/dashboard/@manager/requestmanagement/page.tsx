"use client";

import { useEffect } from "react";
import { useRequestManagementStore } from "./_store/request-management-store";
import { RequestDetail } from "./_components/request-detail";
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
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Loader2,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
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
    selectedRequest,
    isLoading,
    isDetailOpen,
    page,
    pageSize,
    total,
    totalPages,
    search,
    status,
    fetchRequests,
    setPage,
    setPageSize,
    setSearch,
    setStatus,
    setDetailOpen,
    fetchRequestById,
  } = useRequestManagementStore();

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleViewDetails = async (request: any) => {
    await fetchRequestById(request.id);
    setDetailOpen(true);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="text-xs bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {t("dashboard.approved")}
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="text-xs">
            <XCircle className="w-3 h-3 mr-1" />
            {t("dashboard.rejected")}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {t("dashboard.pending")}
          </Badge>
        );
    }
  };

  const getStaffApproval = (request: any) => {
    const staffStatus = request.statusbystaff || "pending";

    if (staffStatus === "approved") {
      return (
        <Badge variant="default" className="text-xs bg-green-600">
          {t("dashboard.done")}
        </Badge>
      );
    }
    if (staffStatus === "rejected") {
      return (
        <Badge variant="destructive" className="text-xs">
          {t("dashboard.rejected")}
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
    const managerStatus = request.statusbyadmin || "pending";

    if (managerStatus === "approved") {
      return (
        <Badge variant="default" className="text-xs bg-blue-600">
          {t("dashboard.done")}
        </Badge>
      );
    }
    if (managerStatus === "rejected") {
      return (
        <Badge variant="destructive" className="text-xs">
          {t("dashboard.rejected")}
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
    <div className="w-full h-dvh overflow-y-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {t("dashboard.requestManagement")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("dashboard.manageServiceRequestsForOffice")}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchRequests()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("dashboard.searchByServiceOrCustomer")}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={status || "all"}
              onValueChange={(value) => setStatus(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t("dashboard.show")}:
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => setPageSize(parseInt(value))}
            >
              <SelectTrigger className="w-[80px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {t("dashboard.itemsPerPage")}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">
                {t("dashboard.noRequestsFound")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || status
                  ? t("dashboard.tryAdjustingFilters")
                  : t("dashboard.noRequestsSubmitted")}
              </p>
            </div>
          ) : (
            <>
              <div className="h-dvh overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("dashboard.service")}</TableHead>
                      <TableHead>{t("dashboard.customer")}</TableHead>
                      <TableHead>{t("common.date")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead>{t("dashboard.staffApproval")}</TableHead>
                      <TableHead>{t("dashboard.managerApproval")}</TableHead>
                      <TableHead className="text-right">
                        {t("common.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.service.name}
                        </TableCell>
                        <TableCell>{request.user.username}</TableCell>
                        <TableCell>
                          {format(new Date(request.date), "MMM dd, yyyy")}
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
              {total > 0 && (
                <div className="border-t p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                      {t("dashboard.showing")} {(page - 1) * pageSize + 1}{" "}
                      {t("dashboard.to")} {Math.min(page * pageSize, total)}{" "}
                      {t("dashboard.of")} {total} {t("dashboard.requests")}
                    </div>
                    {totalPages > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => page > 1 && setPage(page - 1)}
                              className={
                                page === 1
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                          ).map((pageNum) => {
                            if (
                              pageNum === 1 ||
                              pageNum === totalPages ||
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
                                page < totalPages && setPage(page + 1)
                              }
                              className={
                                page === totalPages
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
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
