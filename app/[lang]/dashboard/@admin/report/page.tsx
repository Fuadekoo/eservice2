"use client";

import { useEffect, useState } from "react";
import { useReportStore } from "./_store/report-store";
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
  FileText,
  Clock,
  CheckCircle2,
  Archive,
  Send,
  User,
  Building2,
  Check,
  X,
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
import { ReportDetail } from "./_components/report-detail";
import { Card, CardContent } from "@/components/ui/card";
import useTranslation from "@/hooks/useTranslation";

export default function ReportManagementPage() {
  const { t } = useTranslation();
  const {
    reports,
    selectedReport,
    isLoading,
    isDetailOpen,
    page,
    pageSize,
    total,
    totalPages,
    search,
    status,
    officeId,
    fetchReports,
    fetchReportById,
    updateReportStatus,
    setPage,
    setPageSize,
    setSearch,
    setStatus,
    setOfficeId,
    setDetailOpen,
  } = useReportStore();

  const [localSearch, setLocalSearch] = useState("");
  const [offices, setOffices] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingOffices, setIsLoadingOffices] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Fetch offices on mount
  useEffect(() => {
    const fetchOffices = async () => {
      setIsLoadingOffices(true);
      try {
        const response = await fetch("/api/office?limit=100", {
          cache: "no-store",
        });
        const result = await response.json();
        if (result.success) {
          const officesData = Array.isArray(result.data)
            ? result.data
            : result.data?.offices || [];
          setOffices(
            officesData.map((office: any) => ({
              id: office.id,
              name: office.name,
            }))
          );
        }
      } catch (error: any) {
        console.error("Error fetching offices:", error);
      } finally {
        setIsLoadingOffices(false);
      }
    };
    fetchOffices();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, setSearch]);

  const handleViewDetails = async (report: any) => {
    try {
      await fetchReportById(report.id);
      setDetailOpen(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to load report details");
    }
  };

  const handleApproveReject = async (
    reportId: string,
    action: "approve" | "reject"
  ) => {
    try {
      setIsProcessing(reportId);
      await updateReportStatus(reportId, action);
      toast.success(
        `Report ${action === "approve" ? "approved" : "rejected"} successfully`
      );
      // Refresh the list
      await fetchReports();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} report`);
    } finally {
      setIsProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge
            variant="default"
            className="flex items-center gap-1 w-fit bg-blue-600"
          >
            <Send className="w-3 h-3" />
            {t("dashboard.sent")}
          </Badge>
        );
      case "received":
        return (
          <Badge
            variant="default"
            className="flex items-center gap-1 w-fit bg-green-600"
          >
            <CheckCircle2 className="w-3 h-3" />
            {t("dashboard.received")}
          </Badge>
        );
      case "read":
        return (
          <Badge
            variant="default"
            className="flex items-center gap-1 w-fit bg-purple-600"
          >
            <CheckCircle2 className="w-3 h-3" />
            {t("dashboard.read")}
          </Badge>
        );
      case "archived":
        return (
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            <Archive className="w-3 h-3" />
            {t("dashboard.archived")}
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

  return (
    <div className="w-full h-dvh overflow-y-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("dashboard.reportManagement")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("dashboard.viewAndManageReports")}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchReports()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t("dashboard.searchReports")}
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={officeId || "all"}
                  onValueChange={(value) =>
                    setOfficeId(value === "all" ? "" : value)
                  }
                  disabled={isLoadingOffices}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
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
                  onValueChange={(value) =>
                    setStatus(value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder={t("dashboard.allStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("dashboard.allStatus")}</SelectItem>
                    <SelectItem value="pending">{t("dashboard.pending")}</SelectItem>
                    <SelectItem value="sent">{t("dashboard.sent")}</SelectItem>
                    <SelectItem value="received">{t("dashboard.received")}</SelectItem>
                    <SelectItem value="read">{t("dashboard.readApproved")}</SelectItem>
                    <SelectItem value="archived">
                      {t("dashboard.archivedRejected")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t("dashboard.show")}:</span>
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
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">{t("dashboard.noReportsFound")}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {search || status
                    ? t("dashboard.tryAdjustingFilters")
                    : t("dashboard.noReportsReceivedYet")}
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("dashboard.reportName")}</TableHead>
                      <TableHead>{t("common.description")}</TableHead>
                      <TableHead>{t("dashboard.sentBy")}</TableHead>
                      <TableHead>{t("navigation.office")}</TableHead>
                      <TableHead>{t("dashboard.files")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead>{t("dashboard.receivedDate")}</TableHead>
                      <TableHead className="text-right">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          {report.name}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm line-clamp-2 max-w-md">
                            {report.description}
                          </p>
                        </TableCell>
                        <TableCell>
                          {report.reportSentByUser ? (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">
                                  {report.reportSentByUser.username}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {report.reportSentByUser.phoneNumber}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              N/A
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {report.reportSentByUser?.office ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">
                                {report.reportSentByUser.office.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              N/A
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {report.fileData?.length || 0} file(s)
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(report.receiverStatus)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">
                              {format(
                                new Date(report.createdAt),
                                "MMM dd, yyyy"
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(report.createdAt), "hh:mm a")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {report.receiverStatus !== "read" &&
                              report.receiverStatus !== "archived" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleApproveReject(report.id, "approve")
                                    }
                                    disabled={isProcessing === report.id}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    {isProcessing === report.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Check className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleApproveReject(report.id, "reject")
                                    }
                                    disabled={isProcessing === report.id}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    {isProcessing === report.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <X className="w-4 h-4" />
                                    )}
                                  </Button>
                                </>
                              )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(report)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {total > 0 && (
                  <div className="border-t p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-muted-foreground">
                        {t("dashboard.showing")} {(page - 1) * pageSize + 1} {t("dashboard.to")}{" "}
                        {Math.min(page * pageSize, total)} {t("dashboard.of")} {total} {t("dashboard.reports")}
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
          </CardContent>
        </Card>
      </div>

      {/* Report Detail Dialog */}
      <ReportDetail
        report={selectedReport}
        open={isDetailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
