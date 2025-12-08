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
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {report.fileData?.map((file) => {
                      const fileUrl = getFileUrl(file.filepath);
                      const filepath = file.filepath;
                      const isImage = isImageFile(filepath);
                      const isPdf = isPdfFile(filepath);

                      return (
                        <Card
                          key={file.id}
                          className="cursor-pointer hover:shadow-lg transition-all"
                          onClick={() => handleViewFile(file)}
                        >
                          <CardContent className="p-4">
                            <div className="flex flex-col items-center text-center space-y-2">
                              {isImage ? (
                                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted">
                                  <Image
                                    src={fileUrl}
                                    alt={file.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-32 rounded-lg bg-muted flex items-center justify-center">
                                  <File className="w-12 h-12 text-muted-foreground" />
                                </div>
                              )}
                              <div className="w-full">
                                <p className="text-sm font-medium truncate">
                                  {file.name}
                                </p>
                                {file.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                    {file.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2 w-full">
                                {isPdf && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="flex-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Extract filename from filepath
                                      let filename = file.filepath;
                                      if (filename.includes("/")) {
                                        filename =
                                          filename.split("/").pop() || filename;
                                      }
                                      window.open(
                                        `/api/filedata/${filename}`,
                                        "_blank"
                                      );
                                    }}
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Open PDF
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={isPdf ? "flex-1" : "w-full"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(fileUrl, "_blank");
                                  }}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* File Viewer Dialog */}
      {selectedFile && (
        <Dialog open={fileViewerOpen} onOpenChange={setFileViewerOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <DialogTitle className="flex items-center gap-2">
                <File className="w-5 h-5" />
                {selectedFile.name}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFileViewerOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {isImageFile(selectedFile.filepath) ? (
                <div className="flex-1 overflow-auto bg-muted p-4">
                  <div className="relative w-full min-h-[400px] rounded-lg overflow-hidden bg-background">
                    <Image
                      src={getFileUrl(selectedFile.filepath)}
                      alt={selectedFile.name}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              ) : isPdfFile(selectedFile.filepath) ? (
                <div className="flex-1 overflow-hidden bg-muted flex flex-col">
                  {/* Open PDF Link */}
                  <div className="px-6 py-3 border-b bg-background flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      PDF Document
                    </p>
                    <a
                      href={getFileUrl(selectedFile.filepath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      Open PDF
                    </a>
                  </div>
                  {/* PDF Preview */}
                  <div className="flex-1 overflow-hidden">
                    <iframe
                      src={`${getFileUrl(
                        selectedFile.filepath
                      )}#toolbar=1&navpanes=1&scrollbar=1`}
                      className="w-full h-dvh border-0"
                      title={selectedFile.name}
                      style={{ minHeight: "100%" }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-dvh bg-muted">
                  <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Preview not available for this file type
                  </p>
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(getFileUrl(selectedFile.filepath), "_blank")
                    }
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                  </Button>
                </div>
              )}
              {selectedFile.description && (
                <div className="px-6 py-4 border-t bg-background">
                  <p className="text-sm text-muted-foreground">
                    {selectedFile.description}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
