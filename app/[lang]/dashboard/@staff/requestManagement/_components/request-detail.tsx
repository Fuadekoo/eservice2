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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { useRequestManagementStore } from "../_store/request-management-store";
import Image from "next/image";
import { toast } from "sonner";
import { calculateOverallStatus } from "@/lib/request-status";
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
  const [approveNote, setApproveNote] = useState("");
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [serviceStaff, setServiceStaff] = useState<any[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [canApproveService, setCanApproveService] = useState(false);

  const { fetchRequestById, approveRequest, rejectRequest, isSubmitting } =
    useRequestManagementStore();

  // Check if staff can approve this service
  const checkCanApprove = async (requestId: string) => {
    try {
      const response = await fetch(
        `/api/request/${requestId}/can-approve-staff`
      );
      const result = await response.json();

      if (result.success) {
        setCanApproveService(result.canApprove);
      } else {
        setCanApproveService(false);
      }
    } catch (error) {
      console.error("Error checking approval permission:", error);
      setCanApproveService(false);
    }
  };

  // Refresh request data when dialog opens
  useEffect(() => {
    if (open && request) {
      fetchRequestById(request.id);
      fetchServiceStaff();
      checkCanApprove(request.id);
    }
  }, [open, request?.id, fetchRequestById]);

  // Fetch staff assigned to this service
  const fetchServiceStaff = async () => {
    if (!request?.serviceId) return;

    setIsLoadingStaff(true);
    try {
      const response = await fetch(`/api/service/${request.serviceId}/staff`);
      const result = await response.json();

      if (result.success && result.data) {
        const staffList = result.data.assignedStaff || [];
        setServiceStaff(staffList);
      }
    } catch (error) {
      console.error("Error fetching service staff:", error);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleViewFile = (file: FileData) => {
    setSelectedFile(file);
    setFileViewerOpen(true);
  };

  const handleApprove = async () => {
    if (!request) return;

    try {
      await approveRequest(request.id, approveNote || undefined);
      toast.success("Request approved successfully");
      setIsApproveDialogOpen(false);
      setApproveNote("");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to approve request");
    }
  };

  const handleReject = async () => {
    if (!request) return;

    try {
      await rejectRequest(request.id, approveNote || undefined);
      toast.success("Request rejected successfully");
      setIsRejectDialogOpen(false);
      setApproveNote("");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to reject request");
    }
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

  if (!request) return null;

  const overallStatus = calculateOverallStatus(
    request.statusbystaff,
    request.statusbyadmin
  );
  const statusInfo = statusConfig[overallStatus];
  const StatusIcon = statusInfo.icon;
  const canApprove =
    canApproveService &&
    !request.approveStaff &&
    request.statusbystaff === "pending";

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
                  Request Details
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

          {/* Assigned Staff */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assigned Staff</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStaff ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : serviceStaff.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No staff assigned to this service
                </p>
              ) : (
                <div className="space-y-2">
                  {serviceStaff.map((staff: any) => (
                    <div
                      key={staff.id}
                      className="flex items-center gap-3 p-2 rounded-lg border"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {staff.userName || staff.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {staff.userPhone || staff.phoneNumber}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Staff
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Staff Approval Actions */}
          {canApprove && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Staff Approval</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="approveNote">Note (Optional)</Label>
                  <Textarea
                    id="approveNote"
                    placeholder="Add a note about this decision..."
                    value={approveNote}
                    onChange={(e) => setApproveNote(e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setIsApproveDialogOpen(true)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve Request
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setIsRejectDialogOpen(true)}
                    variant="destructive"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Request
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="files">
                Files ({request.fileData.length})
              </TabsTrigger>
              <TabsTrigger value="appointments">
                Appointments ({request.appointments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Username:</strong> {request.user.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Phone:</strong> {request.user.phoneNumber}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Service Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Service Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">
                      {request.service.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {request.service.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Office:</strong> {request.service.office.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {request.service.office.address}, Room{" "}
                      {request.service.office.roomNumber}
                    </span>
                  </div>
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
                      {format(new Date(request.date), "PPP")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Current Address:</strong> {request.currentAddress}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Created:</strong>{" "}
                      {format(new Date(request.createdAt), "PPP p")}
                    </span>
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
            </TabsContent>

            <TabsContent value="files" className="space-y-4 mt-4">
              {request.fileData.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No files uploaded
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {request.fileData.map((file) => {
                    const fileUrl = getFileUrl(file.filepath);
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
              {request.appointments.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No appointments scheduled
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {request.appointments.map((apt) => (
                    <Card key={apt.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {format(new Date(apt.date), "PPP")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{apt.status}</Badge>
                          </div>
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

      {/* Approve Confirmation Dialog */}
      <AlertDialog
        open={isApproveDialogOpen}
        onOpenChange={setIsApproveDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this request? This action will
              mark the request as approved by staff.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this request? This action will
              mark the request as rejected by staff.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-red-600 hover:bg-red-700">
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
