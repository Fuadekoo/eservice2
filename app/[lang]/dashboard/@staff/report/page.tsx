"use client";

import { useEffect, useState } from "react";
import { useStaffReportStore } from "./_store/report-store";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Plus,
  Inbox,
  Upload,
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
import { ReportForm } from "./_components/report-form";
import { Card, CardContent } from "@/components/ui/card";
import useTranslation from "@/hooks/useTranslation";

export default function StaffReportPage() {
  const { t } = useTranslation();
  const {
    reports,
    selectedReport,
    isLoading,
    isDetailOpen,
    isFormOpen,
    reportType,
    page,
    pageSize,
    total,
    totalPages,
    search,
    status,
    fetchReports,
    fetchReportById,
    setReportType,
    setPage,
    setPageSize,
    setSearch,
    setStatus,
    setDetailOpen,
    setFormOpen,
  } = useStaffReportStore();

  const [localSearch, setLocalSearch] = useState("");

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
      toast.error(
        error.message ||
          t("dashboard.failedToLoadReportDetails") ||
          "Failed to load report details"
      );
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
            {t("dashboard.sent") || "Sent"}
          </Badge>
        );
      case "received":
        return (
          <Badge
            variant="default"
            className="flex items-center gap-1 w-fit bg-green-600"
          >
            <CheckCircle2 className="w-3 h-3" />
            {t("dashboard.received") || "Received"}
          </Badge>
        );
      case "read":
        return (
          <Badge
            variant="default"
            className="flex items-center gap-1 w-fit bg-purple-600"
          >
            <CheckCircle2 className="w-3 h-3" />
            {t("dashboard.read") || "Read"}
          </Badge>
        );
      case "archived":
        return (
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            <Archive className="w-3 h-3" />
            {t("dashboard.archived") || "Archived"}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" />
            {t("dashboard.pending") || "Pending"}
          </Badge>
        );
    }
  };

  const renderTable = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (reports.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">
            {t("dashboard.noReportsFound") || "No Reports Found"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {search || status
              ? t("dashboard.tryAdjustingFilters") ||
                "Try adjusting your filters"
              : reportType === "received"
              ? t("dashboard.noReportsReceivedFromManager") ||
                "No reports received from manager"
              : t("dashboard.noReportsSentToManager") ||
                "No reports sent to manager"}
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="h-dvh overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t("dashboard.reportName") || "Report Name"}
                </TableHead>
                <TableHead>
                  {t("dashboard.description") || "Description"}
                </TableHead>
                {reportType === "received" ? (
                  <TableHead>{t("dashboard.sentBy") || "Sent By"}</TableHead>
                ) : (
                  <TableHead>{t("dashboard.sentTo") || "Sent To"}</TableHead>
                )}
                <TableHead>{t("dashboard.files") || "Files"}</TableHead>
                <TableHead>{t("common.status") || "Status"}</TableHead>
                <TableHead>{t("common.date") || "Date"}</TableHead>
                <TableHead className="text-right">
                  {t("common.actions") || "Actions"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.name}</TableCell>
                  <TableCell>
                    <p className="text-sm line-clamp-2 max-w-md">
                      {report.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    {reportType === "received" ? (
                      report.reportSentByUser ? (
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
                      )
                    ) : report.reportSentToUser ? (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {report.reportSentToUser.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {report.reportSentToUser.phoneNumber}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {report.fileData?.length || 0}{" "}
                      {t("dashboard.file") || "file"}(s)
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(report.receiverStatus)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">
                        {format(new Date(report.createdAt), "MMM dd, yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(report.createdAt), "hh:mm a")}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDetails(report)}
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
                {t("dashboard.showing") || "Showing"}{" "}
                {(page - 1) * pageSize + 1} {t("dashboard.to") || "to"}{" "}
                {Math.min(page * pageSize, total)} {t("dashboard.of") || "of"}{" "}
                {total} {t("dashboard.reports") || "reports"}
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
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (pageNum) => {
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
                      }
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => page < totalPages && setPage(page + 1)}
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
    );
  };

  return (
    <div className="w-full h-dvh overflow-y-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {t("dashboard.reportManagement") || "Report Management"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("dashboard.viewReceivedAndSentReports") ||
                "View received and sent reports"}
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

        {/* Tabs for Received and Sent Reports */}
        <Tabs
          value={reportType}
          onValueChange={(value) => setReportType(value as "received" | "sent")}
          className="space-y-6"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="received" className="flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              {t("dashboard.receivedReports") || "Received Reports"}
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {t("dashboard.sentReports") || "Sent Reports"}
            </TabsTrigger>
          </TabsList>

          {/* Received Reports Tab */}
          <TabsContent value="received" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder={
                          t("dashboard.searchByReportNameDescriptionSender") ||
                          "Search by report name, description, or sender..."
                        }
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select
                      value={status || "all"}
                      onValueChange={(value) =>
                        setStatus(value === "all" ? "" : value)
                      }
                    >
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue
                          placeholder={t("dashboard.allStatus") || "All Status"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {t("dashboard.allStatus") || "All Status"}
                        </SelectItem>
                        <SelectItem value="pending">
                          {t("dashboard.pending") || "Pending"}
                        </SelectItem>
                        <SelectItem value="sent">
                          {t("dashboard.sent") || "Sent"}
                        </SelectItem>
                        <SelectItem value="received">
                          {t("dashboard.received") || "Received"}
                        </SelectItem>
                        <SelectItem value="read">
                          {t("dashboard.read") || "Read"}
                        </SelectItem>
                        <SelectItem value="archived">
                          {t("dashboard.archived") || "Archived"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {t("dashboard.show") || "Show"}:
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
                      {t("dashboard.itemsPerPage") || "items per page"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardContent className="p-0">{renderTable()}</CardContent>
            </Card>
          </TabsContent>

          {/* Sent Reports Tab */}
          <TabsContent value="sent" className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {t("dashboard.sentReports") || "Sent Reports"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.reportsSentToManager") ||
                    "Reports sent to your office manager"}
                </p>
              </div>
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t("dashboard.addReport") || "Add Report"}
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
                        placeholder={
                          t(
                            "dashboard.searchByReportNameDescriptionRecipient"
                          ) ||
                          "Search by report name, description, or recipient..."
                        }
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select
                      value={status || "all"}
                      onValueChange={(value) =>
                        setStatus(value === "all" ? "" : value)
                      }
                    >
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue
                          placeholder={t("dashboard.allStatus") || "All Status"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {t("dashboard.allStatus") || "All Status"}
                        </SelectItem>
                        <SelectItem value="pending">
                          {t("dashboard.pending") || "Pending"}
                        </SelectItem>
                        <SelectItem value="sent">
                          {t("dashboard.sent") || "Sent"}
                        </SelectItem>
                        <SelectItem value="received">
                          {t("dashboard.received") || "Received"}
                        </SelectItem>
                        <SelectItem value="read">
                          {t("dashboard.read") || "Read"}
                        </SelectItem>
                        <SelectItem value="archived">
                          {t("dashboard.archived") || "Archived"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {t("dashboard.show") || "Show"}:
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
                      {t("dashboard.itemsPerPage") || "items per page"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardContent className="p-0">{renderTable()}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Report Detail Dialog */}
      <ReportDetail
        report={selectedReport}
        open={isDetailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* Report Form Dialog */}
      <ReportForm
        open={isFormOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => {
          fetchReports();
          setFormOpen(false);
        }}
      />
    </div>
  );
}
