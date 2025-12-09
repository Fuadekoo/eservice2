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
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  File,
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { calculateOverallStatus } from "@/lib/request-status";
import { useMyOfficeStore } from "../_store/myoffice-store";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import useTranslation from "@/hooks/useTranslation";

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
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("details");
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [approveNote, setApproveNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<Request | null>(request);
  const { fetchRequests } = useMyOfficeStore();

  // Fetch full request details when dialog opens
  useEffect(() => {
    if (open && request) {
      fetchRequestDetails(request.id);
    }
  }, [open, request?.id]);

  const fetchRequestDetails = async (requestId: string) => {
    try {
      const response = await fetch(`/api/request/${requestId}`, {
        cache: "no-store",
      });
      const result = await response.json();
      if (result.success && result.data) {
        setCurrentRequest(result.data);
      }
    } catch (error) {
      console.error("Error fetching request details:", error);
    }
  };

  if (!currentRequest) return null;

  const overallStatus = calculateOverallStatus(
    currentRequest.statusbystaff,
    currentRequest.statusbyadmin
  );
  const statusInfo = statusConfig[overallStatus];
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

  const handleApprove = async () => {
    if (!currentRequest) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/request/${currentRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statusbyadmin: "approved",
          approveNote: approveNote || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Request approved successfully");
        setIsApproveDialogOpen(false);
        setApproveNote("");
        fetchRequestDetails(currentRequest.id);
        fetchRequests();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to approve request");
      }
    } catch (error: any) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!currentRequest) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/request/${currentRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statusbyadmin: "rejected",
          approveNote: approveNote || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Request rejected");
        setIsRejectDialogOpen(false);
        setApproveNote("");
        fetchRequestDetails(currentRequest.id);
        fetchRequests();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to reject request");
      }
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canApprove = currentRequest.statusbyadmin === "pending";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusIcon
                  className={`w-5 h-5 ${
                    statusInfo.variant === "default"
                      ? "text-green-600"
                      : statusInfo.variant === "destructive"
                      ? "text-red-600"
                      : "text-muted-foreground"
                  }`}
                />
                <DialogTitle>Request Details</DialogTitle>
              </div>
              <Badge variant={statusInfo.variant}>
                {statusInfo.label}
              </Badge>
            </div>
            <DialogDescription>
              Request ID: {currentRequest.id}
            </DialogDescription>
          </DialogHeader>

          {/* Approval Actions */}
          {canApprove && (
            <div className="flex gap-2 pb-4 border-b">
              <Button
                onClick={() => setIsApproveDialogOpen(true)}
                className="flex-1"
                variant="default"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve Request
              </Button>
              <Button
                onClick={() => setIsRejectDialogOpen(true)}
                className="flex-1"
                variant="destructive"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Request
              </Button>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="files">
                Files ({currentRequest.fileData?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="appointments">
                Appointments ({currentRequest.appointments?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Username:</strong> {currentRequest.user?.username || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Phone:</strong> {currentRequest.user?.phoneNumber || "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Service Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Service Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">
                      {currentRequest.service?.name || "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentRequest.service?.description || ""}
                    </p>
                  </div>
                  {currentRequest.service?.office && (
                    <>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>Office:</strong> {currentRequest.service.office.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {currentRequest.service.office.address}, Room{" "}
                          {currentRequest.service.office.roomNumber}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Request Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Request Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Requested Date:</strong>{" "}
                      {format(new Date(currentRequest.date), "PPP")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Current Address:</strong> {currentRequest.currentAddress}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Created:</strong>{" "}
                      {format(new Date(currentRequest.createdAt), "PPP p")}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Approval Information */}
              {(currentRequest.approveStaff ||
                currentRequest.approveManager ||
                currentRequest.approveNote) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Approval Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {currentRequest.approveStaff && (
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">Approved by Staff</p>
                          <p className="text-sm text-muted-foreground">
                            {currentRequest.approveStaff.user?.username || "N/A"}
                          </p>
                          {currentRequest.approveStaff.user?.phoneNumber && (
                            <p className="text-xs text-muted-foreground">
                              Phone: {currentRequest.approveStaff.user.phoneNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {currentRequest.approveManager && (
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">Approved by Manager</p>
                          <p className="text-sm text-muted-foreground">
                            {currentRequest.approveManager.user?.username || "N/A"}
                          </p>
                          {currentRequest.approveManager.user?.phoneNumber && (
                            <p className="text-xs text-muted-foreground">
                              Phone: {currentRequest.approveManager.user.phoneNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {currentRequest.approveNote && (
                      <div className="flex items-start gap-3 pt-2 border-t">
                        <FileText className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Approval Note</p>
                          <p className="text-sm text-muted-foreground">
                            {currentRequest.approveNote}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="files" className="space-y-4 mt-4">
              {!currentRequest.fileData || currentRequest.fileData.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No files uploaded
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {currentRequest.fileData.map((file) => {
                    const fileUrl = getFileUrl(file.filepath, false);
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
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="appointments" className="space-y-4 mt-4">
              {!currentRequest.appointments || currentRequest.appointments.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No appointments scheduled
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {currentRequest.appointments.map((apt) => (
                    <Card key={apt.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {format(new Date(apt.date), "PPP")}
                            </span>
                            {apt.time && (
                              <span className="text-sm text-muted-foreground">
                                at {apt.time}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{apt.status}</Badge>
                          </div>
                          {apt.notes && (
                            <p className="text-sm text-muted-foreground">{apt.notes}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* File Viewer Dialog */}
      {selectedFile && (
        <Dialog open={fileViewerOpen} onOpenChange={setFileViewerOpen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
            <div className="flex flex-col h-[95vh]">
              <div className="flex items-center justify-between p-4 border-b">
                <DialogTitle>{selectedFile.name}</DialogTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      window.open(
                        getFileUrl(selectedFile.filepath, true),
                        "_blank"
                      )
                    }
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFileViewerOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-col h-[calc(95vh-80px)] overflow-hidden">
                {isImageFile(selectedFile.filepath) ? (
                  <div className="flex-1 overflow-auto bg-muted p-4 flex items-center justify-center min-h-[400px]">
                    <div className="relative w-full max-w-full h-dvh">
                      <Image
                        src={getFileUrl(selectedFile.filepath, false)}
                        alt={selectedFile.name}
                        fill
                        className="object-contain"
                        unoptimized
                        sizes="(max-width: 95vw) 95vw, 95vw"
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
                      className="w-full h-dvh border-0"
                      title={selectedFile.name}
                      style={{ minHeight: "100%" }}
                    />
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
                        window.open(
                          getFileUrl(selectedFile.filepath, true),
                          "_blank"
                        )
                      }
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this request? You can add an optional note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approve-note">Approval Note (Optional)</Label>
              <Textarea
                id="approve-note"
                placeholder="Add a note about this approval..."
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Approving..." : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this request? Please provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-note">Rejection Reason (Required)</Label>
              <Textarea
                id="reject-note"
                placeholder="Please provide a reason for rejection..."
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                rows={3}
                required
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isSubmitting || !approveNote.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Rejecting..." : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

