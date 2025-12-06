"use client";

import { useEffect, useState } from "react";
import { Request, RequestStatus, FileData } from "../_types";
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
  MapPin,
  Calendar,
  Building2,
  Phone,
  Mail,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  File,
} from "lucide-react";
import { format } from "date-fns";
import { useCustomerRequestStore } from "../_store";
import Image from "next/image";

interface RequestDetailProps {
  request: Request | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<
  RequestStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive";
    icon: any;
  }
> = {
  pending: {
    label: "Pending",
    variant: "secondary",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    variant: "default",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    variant: "destructive",
    icon: XCircle,
  },
};

export function RequestDetail({
  request,
  open,
  onOpenChange,
}: RequestDetailProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);

  const { fetchRequestById } = useCustomerRequestStore();

  // Refresh request data when dialog opens
  useEffect(() => {
    if (open && request) {
      fetchRequestById(request.id);
    }
  }, [open, request?.id, fetchRequestById]);

  if (!request) return null;

  const statusInfo = statusConfig[request.status];
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

  const getFileUrl = (filepath: string, useApi: boolean = true) => {
    // If filepath is already a full URL, return it
    if (filepath.startsWith("http")) {
      return filepath;
    }

    // Extract filename from filepath
    // Handle paths like "filedata/filename.pdf" or "filedata/upload/logo/filename.jpg" or just "filename.pdf"
    let filename = filepath;
    if (filepath.includes("/")) {
      filename = filepath.split("/").pop() || filepath;
    }

    // All files are now served via API endpoint (not in public folder)
    // Check if it's a logo file (from upload/logo)
    if (filepath.includes("upload/logo")) {
      return `/api/upload/logo/${filename}`;
    }

    // Regular filedata files
    return `/api/filedata/${filename}`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">
                  {request.service.name}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Request Status & Details
                </DialogDescription>
              </div>
              <Badge
                variant={statusInfo.variant}
                className="flex items-center gap-1.5"
              >
                <StatusIcon className="w-4 h-4" />
                {statusInfo.label}
              </Badge>
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="appointments">
                Appointments ({request.appointments.length})
              </TabsTrigger>
              <TabsTrigger value="files">
                Files ({request.fileData.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              {/* Request Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Request Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <Building2 className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Office</p>
                        <p className="text-sm text-muted-foreground">
                          {request.service.office.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Room {request.service.office.roomNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {request.service.office.address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Your Address</p>
                        <p className="text-sm text-muted-foreground">
                          {request.currentAddress}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Request Date</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(request.date), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Created At</p>
                        <p className="text-sm text-muted-foreground">
                          {format(
                            new Date(request.createdAt),
                            "MMM dd, yyyy HH:mm"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Approval Information */}
              {(request.approveStaff ||
                request.approveManager ||
                request.approveNote) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Approval Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {request.approveStaff && (
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">
                            Approved by Staff
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.approveStaff.user.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Phone: {request.approveStaff.user.phoneNumber}
                          </p>
                        </div>
                      </div>
                    )}
                    {request.approveManager && (
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">
                            Approved by Manager
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.approveManager.user.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Phone: {request.approveManager.user.phoneNumber}
                          </p>
                        </div>
                      </div>
                    )}
                    {request.approveNote && (
                      <div className="flex items-start gap-3 pt-2 border-t">
                        <FileText className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Approval Note</p>
                          <p className="text-sm text-muted-foreground">
                            {request.approveNote}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Status Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Status Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Current Status
                      </span>
                      <Badge
                        variant={statusInfo.variant}
                        className="flex items-center gap-1.5"
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                    {request.status === RequestStatus.PENDING && (
                      <p className="text-sm text-muted-foreground">
                        Your request is pending review. You can edit or delete
                        it until it's approved.
                      </p>
                    )}
                    {request.status === RequestStatus.APPROVED && (
                      <p className="text-sm text-muted-foreground">
                        Your request has been approved. You can view
                        appointments and track progress.
                      </p>
                    )}
                    {request.status === RequestStatus.REJECTED && (
                      <p className="text-sm text-muted-foreground">
                        Your request has been rejected. Please contact the
                        office for more information.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appointments" className="space-y-4 mt-4">
              {/* Appointments List */}
              <div className="space-y-3">
                {request.appointments.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No appointments scheduled yet
                    </CardContent>
                  </Card>
                ) : (
                  request.appointments.map((appointment) => (
                    <Card key={appointment.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">
                                {format(
                                  new Date(appointment.date),
                                  "MMM dd, yyyy"
                                )}
                              </span>
                              {appointment.time && (
                                <span className="text-sm text-muted-foreground">
                                  at {appointment.time}
                                </span>
                              )}
                            </div>
                            {appointment.notes && (
                              <p className="text-sm text-muted-foreground">
                                {appointment.notes}
                              </p>
                            )}
                            <Badge variant="secondary">
                              {appointment.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="files" className="space-y-4 mt-4">
              {/* Files Grid */}
              <div className="space-y-3">
                {request.fileData.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No files uploaded
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {request.fileData.map((file) => {
                      const fileUrl = getFileUrl(file.filepath, false); // Direct path for thumbnails
                      const isImage = isImageFile(file.filepath);
                      const isPdf = isPdfFile(file.filepath);

                      return (
                        <Card
                          key={file.id}
                          className="cursor-pointer hover:shadow-lg transition-all"
                          onClick={() => handleViewFile(file)}
                        >
                          <CardContent className="p-0">
                            {isImage ? (
                              <div className="relative aspect-square w-full">
                                <Image
                                  src={fileUrl}
                                  alt={file.name}
                                  fill
                                  className="object-cover rounded-t-lg"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className="aspect-square flex items-center justify-center bg-muted rounded-t-lg">
                                {isPdf ? (
                                  <FileText className="w-12 h-12 text-muted-foreground" />
                                ) : (
                                  <File className="w-12 h-12 text-muted-foreground" />
                                )}
                              </div>
                            )}
                            <div className="p-3">
                              <p
                                className="text-sm font-medium truncate"
                                title={file.name}
                              >
                                {file.name}
                              </p>
                              {file.description && (
                                <p className="text-xs text-muted-foreground truncate mt-1">
                                  {file.description}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(
                                  new Date(file.createdAt),
                                  "MMM dd, yyyy"
                                )}
                              </p>
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

      {/* File Viewer Modal */}
      <Dialog open={fileViewerOpen} onOpenChange={setFileViewerOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="truncate pr-4">
                {selectedFile?.name}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {selectedFile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(getFileUrl(selectedFile.filepath), "_blank");
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFileViewerOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          {selectedFile && (
            <div className="flex flex-col h-[calc(95vh-80px)] overflow-hidden">
              {isImageFile(selectedFile.filepath) ? (
                <div className="flex-1 overflow-auto bg-muted p-4 flex items-center justify-center min-h-[400px]">
                  <div className="relative w-full max-w-full h-full">
                    <Image
                      src={getFileUrl(selectedFile.filepath, false)}
                      alt={selectedFile.name}
                      fill
                      className="object-contain"
                      unoptimized
                      sizes="(max-width: 95vw) 95vw, 95vw"
                      onError={(e) => {
                        console.error("Error loading image:", e);
                        // Fallback to API endpoint if direct path fails
                        const target = e.target as HTMLImageElement;
                        if (
                          target.src !== getFileUrl(selectedFile.filepath, true)
                        ) {
                          target.src = getFileUrl(selectedFile.filepath, true);
                        }
                      }}
                    />
                  </div>
                </div>
              ) : isPdfFile(selectedFile.filepath) ? (
                <div className="flex-1 overflow-hidden bg-muted">
                  <iframe
                    src={`${getFileUrl(
                      selectedFile.filepath,
                      true
                    )}#toolbar=1&navpanes=1&scrollbar=1`}
                    className="w-full h-full border-0"
                    title={selectedFile.name}
                    style={{ minHeight: "100%" }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-muted">
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
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
