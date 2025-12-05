"use client";

import { useEffect, useRef, useState } from "react";
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
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomerRequestStore } from "../_store";
import { toast } from "sonner";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const { uploadFile, fetchRequestById, isSubmitting } =
    useCustomerRequestStore();

  // Refresh request data when dialog opens
  useEffect(() => {
    if (open && request) {
      fetchRequestById(request.id);
    }
  }, [open, request?.id, fetchRequestById]);

  if (!request) return null;

  const statusInfo = statusConfig[request.status];
  const StatusIcon = statusInfo.icon;
  const canUploadFiles = request.status === RequestStatus.PENDING;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      await uploadFile(request.id, file);
      toast.success("File uploaded successfully");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Refresh request to get updated files
      await fetchRequestById(request.id);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload file");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDownloadFile = (file: FileData) => {
    window.open(file.filepath, "_blank");
  };

  return (
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
                <CardTitle className="text-base">Request Information</CardTitle>
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

            {/* Status Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Status</span>
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
                      Your request is pending review. You can edit or delete it
                      until it's approved.
                    </p>
                  )}
                  {request.status === RequestStatus.APPROVED && (
                    <p className="text-sm text-muted-foreground">
                      Your request has been approved. You can view appointments
                      and track progress.
                    </p>
                  )}
                  {request.status === RequestStatus.REJECTED && (
                    <p className="text-sm text-muted-foreground">
                      Your request has been rejected. Please contact the office
                      for more information.
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
            {/* File Upload - Only for pending requests */}
            {canUploadFiles && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Upload File</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="file-upload">Choose file to upload</Label>
                      <Input
                        ref={fileInputRef}
                        id="file-upload"
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploadingFile || isSubmitting}
                        className="cursor-pointer mt-2"
                      />
                    </div>
                    {uploadingFile && (
                      <p className="text-sm text-muted-foreground">
                        Uploading...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Files List */}
            <div className="space-y-3">
              {request.fileData.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No files uploaded
                  </CardContent>
                </Card>
              ) : (
                request.fileData.map((file) => (
                  <Card key={file.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{file.name}</p>
                            {file.description && (
                              <p className="text-sm text-muted-foreground">
                                {file.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Uploaded{" "}
                              {format(new Date(file.createdAt), "MMM dd, yyyy")}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadFile(file)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
