"use client";

import { useEffect, useState } from "react";
import { Report, FileData } from "../_types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Download,
  Clock,
  CheckCircle2,
  Archive,
  Send,
  User,
  X,
  File,
  Check,
  Building2,
  Loader2,
  FileSpreadsheet,
  Presentation,
  FileImage,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { useReportStore } from "../_store/report-store";
import Image from "next/image";
import { toast } from "sonner";

interface ReportDetailProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive";
    icon: any;
    className?: string;
  }
> = {
  pending: {
    label: "Pending",
    variant: "secondary",
    icon: Clock,
  },
  sent: {
    label: "Sent",
    variant: "default",
    icon: Send,
    className: "bg-blue-600",
  },
  received: {
    label: "Received",
    variant: "default",
    icon: CheckCircle2,
    className: "bg-green-600",
  },
  read: {
    label: "Read",
    variant: "default",
    icon: CheckCircle2,
    className: "bg-purple-600",
  },
  archived: {
    label: "Archived",
    variant: "secondary",
    icon: Archive,
  },
};

export function ReportDetail({
  report,
  open,
  onOpenChange,
}: ReportDetailProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { fetchReportById, updateReportStatus, fetchReports } =
    useReportStore();

  useEffect(() => {
    if (open && report) {
      fetchReportById(report.id);
    }
  }, [open, report?.id, fetchReportById]);

  if (!report) return null;

  const statusInfo =
    statusConfig[report.receiverStatus] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  const handleViewFile = (file: FileData) => {
    setSelectedFile(file);
    setFileViewerOpen(true);
  };

  const isImageFile = (filepath: string) => {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
    return imageExtensions.some((ext) => filepath.toLowerCase().endsWith(ext));
  };

  const isPdfFile = (filepath: string) => {
    return filepath.toLowerCase().endsWith(".pdf");
  };

  const getFileType = (filepath: string): string => {
    const ext = filepath.split(".").pop()?.toLowerCase() || "";
    return ext;
  };

  const getFileIcon = (filepath: string) => {
    const type = getFileType(filepath);
    switch (type) {
      case "pdf":
        return <FileText className="w-5 h-5 text-red-500" />;
      case "ppt":
      case "pptx":
        return <Presentation className="w-5 h-5 text-orange-500" />;
      case "doc":
      case "docx":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "xls":
      case "xlsx":
        return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
        return <FileImage className="w-5 h-5 text-purple-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const getFileTypeLabel = (filepath: string) => {
    const type = getFileType(filepath);
    return type.toUpperCase();
  };

  const officeViewerUrl = (url: string) => {
    const absolute = url.startsWith("http")
      ? url
      : typeof window !== "undefined"
      ? `${window.location.origin}${url}`
      : url;
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
      absolute
    )}`;
  };

  const getFileUrl = (filepath: string) => {
    if (filepath.startsWith("http")) {
      return filepath;
    }

    let filename = filepath;
    if (filepath.includes("/")) {
      filename = filepath.split("/").pop() || filepath;
    }

    if (filepath.includes("upload/logo")) {
      return `/api/upload/logo/${filename}`;
    }

    return `/api/filedata/${filename}`;
  };

  const handleApproveReject = async (action: "approve" | "reject") => {
    if (!report) return;
    try {
      setIsProcessing(true);
      await updateReportStatus(report.id, action);
      toast.success(
        `Report ${action === "approve" ? "approved" : "rejected"} successfully`
      );
      // Refresh the report data
      await fetchReportById(report.id);
      // Refresh the reports list if fetchReports is available
      if (fetchReports) {
        await fetchReports();
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} report`);
    } finally {
      setIsProcessing(false);
    }
  };

  const canApproveReject =
    report.receiverStatus !== "read" && report.receiverStatus !== "archived";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Report Details
            </DialogTitle>
            <DialogDescription>
              View detailed information about this report
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 overflow-hidden flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="files">
                Files ({report.fileData?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="details"
              className="space-y-4 mt-4 overflow-y-auto flex-1"
            >
              {/* Report Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Report Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Report Name
                    </p>
                    <p className="text-base">{report.name}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Description
                    </p>
                    <p className="text-base whitespace-pre-wrap">
                      {report.description}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Status
                    </p>
                    <Badge
                      variant={statusInfo.variant}
                      className={statusInfo.className || ""}
                    >
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Sender Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Sender Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {report.reportSentByUser ? (
                    <>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>Username:</strong>{" "}
                          {report.reportSentByUser.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>Phone:</strong>{" "}
                          {report.reportSentByUser.phoneNumber}
                        </span>
                      </div>
                      {report.reportSentByUser.office && (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            <strong>Office:</strong>{" "}
                            {report.reportSentByUser.office.name}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No sender information
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Receiver Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Receiver Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {report.reportSentToUser ? (
                    <>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>Username:</strong>{" "}
                          {report.reportSentToUser.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>Phone:</strong>{" "}
                          {report.reportSentToUser.phoneNumber}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No receiver information
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Date Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Date Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Created:</strong>{" "}
                      {format(
                        new Date(report.createdAt),
                        "MMM dd, yyyy 'at' hh:mm a"
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Last Updated:</strong>{" "}
                      {format(
                        new Date(report.updatedAt),
                        "MMM dd, yyyy 'at' hh:mm a"
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Approve/Reject Actions */}
              {canApproveReject && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleApproveReject("approve")}
                        disabled={isProcessing}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                        Approve Report
                      </Button>
                      <Button
                        onClick={() => handleApproveReject("reject")}
                        disabled={isProcessing}
                        variant="destructive"
                        className="flex-1"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <X className="w-4 h-4 mr-2" />
                        )}
                        Reject Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent
              value="files"
              className="space-y-4 mt-4 overflow-y-auto flex-1"
            >
              {/* Files Grid */}
              <div className="space-y-3">
                {report.fileData && report.fileData.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No files attached to this report
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {report.fileData?.map((file) => {
                      const fileUrl = getFileUrl(file.filepath);
                      const filepath = file.filepath;

                      return (
                        <div
                          key={file.id}
                          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {getFileIcon(filepath)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                {file.name}
                              </h3>
                              {file.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                  {file.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded">
                                  {getFileTypeLabel(filepath)}
                                </span>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleViewFile(file)}
                                    className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                                    title="View"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const link = document.createElement("a");
                                      link.href = fileUrl;
                                      link.download = file.name;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }}
                                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                    title="Download"
                                  >
                                    <Download className="w-4 h-4" />
                                    Download
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* File Viewer Dialog - Full Screen Modal */}
      {selectedFile && (
        <Dialog open={fileViewerOpen} onOpenChange={setFileViewerOpen}>
          <DialogContent className="!w-screen !h-screen !max-w-none !max-h-none !m-0 !p-0 !rounded-none !top-0 !left-0 !translate-x-0 !translate-y-0 !sm:max-w-none">
            {/* Visually Hidden DialogTitle for accessibility */}
            <DialogTitle className="sr-only">
              {selectedFile.name} - File Preview
            </DialogTitle>

            {/* Close Button - Red X Icon */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFileViewerOpen(false)}
              className="absolute top-4 right-4 z-50 bg-white/90 hover:bg-white text-red-500 hover:text-red-700 rounded-full shadow-lg"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </Button>

            <div className="flex-1 overflow-auto bg-muted/30 !p-0 !m-0">
              {selectedFile ? (
                <div className="w-full h-full flex items-center justify-center p-0 m-0">
                  {(() => {
                    const fileType = getFileType(selectedFile.filepath);
                    const fileUrl = getFileUrl(selectedFile.filepath);

                    // PDF files
                    if (isPdfFile(selectedFile.filepath)) {
                      return (
                        <iframe
                          src={fileUrl}
                          className="w-full h-full border-0"
                          title={selectedFile.name}
                          style={{ minHeight: "100%" }}
                        />
                      );
                    }

                    // Image files
                    if (
                      isImageFile(selectedFile.filepath) ||
                      fileUrl.startsWith("data:image/")
                    ) {
                      return (
                        <img
                          src={fileUrl}
                          alt={selectedFile.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      );
                    }

                    // Office documents (Word, Excel, PowerPoint)
                    if (
                      ["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(
                        fileType
                      )
                    ) {
                      return (
                        <iframe
                          src={officeViewerUrl(fileUrl)}
                          className="w-full h-full border-0"
                          title={selectedFile.name}
                          style={{ minHeight: "100%" }}
                        />
                      );
                    }

                    // Fallback for other file types
                    return (
                      <div className="text-center p-8">
                        <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-4">
                          Unable to preview this file type
                        </p>
                        <Button
                          onClick={() => {
                            const fileUrl = getFileUrl(selectedFile.filepath);
                            const link = document.createElement("a");
                            link.href = fileUrl;
                            link.download = selectedFile.name;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          variant="outline"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download to View
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center p-8">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No file available</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
