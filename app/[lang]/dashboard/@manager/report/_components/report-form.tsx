"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reportSchema, ReportFormValues } from "../_schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useManagerReportStore } from "../_store/report-store";
import { toast } from "sonner";
import { FileText, Upload, X, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ReportFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FilePreview {
  file: File;
  preview: string;
  uploaded?: boolean;
  filepath?: string;
}

export function ReportForm({ open, onOpenChange, onSuccess }: ReportFormProps) {
  const { admins, createReport, fetchAdmins, isLoading } =
    useManagerReportStore();
  const [uploadedFiles, setUploadedFiles] = useState<FilePreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
  });

  const selectedAdmin = watch("reportSentTo");

  useEffect(() => {
    if (open) {
      setIsLoadingAdmins(true);
      fetchAdmins()
        .then(() => {
          setIsLoadingAdmins(false);
        })
        .catch((error) => {
          console.error("Error fetching admins:", error);
          setIsLoadingAdmins(false);
        });
      reset();
      setUploadedFiles([]);
    }
  }, [open, fetchAdmins, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const preview: FilePreview = {
        file,
        preview: URL.createObjectURL(file),
      };
      setUploadedFiles((prev) => [...prev, preview]);
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      updated.forEach((f) => {
        if (f.preview && !f.uploaded) {
          URL.revokeObjectURL(f.preview);
        }
      });
      return updated;
    });
  };

  const onSubmit = async (data: ReportFormValues) => {
    try {
      setIsUploading(true);

      // Upload files first
      const files: { name: string; filepath: string; description?: string }[] =
        [];
      for (const filePreview of uploadedFiles) {
        if (!filePreview.uploaded) {
          const formData = new FormData();
          formData.append("file", filePreview.file);

          const uploadResponse = await fetch("/api/upload/request-file", {
            method: "POST",
            body: formData,
          });

          const uploadResult = await uploadResponse.json();
          if (uploadResult.success) {
            files.push({
              name: filePreview.file.name,
              filepath: uploadResult.data.filepath,
            });
          } else {
            throw new Error(uploadResult.error || "Failed to upload file");
          }
        } else if (filePreview.filepath) {
          files.push({
            name: filePreview.file.name,
            filepath: filePreview.filepath,
          });
        }
      }

      // Create report with files
      const response = await fetch("/api/manager/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          reportSentTo: data.reportSentTo,
          files: files,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to create report");
      }

      toast.success("Report created successfully");
      reset();
      setUploadedFiles([]);
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating report:", error);
      toast.error(error.message || "Failed to create report");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Report</DialogTitle>
          <DialogDescription>
            Send a report to an admin with optional file attachments
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Report Name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Enter report name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Enter report description"
              rows={5}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reportSentTo">Send To (Admin) *</Label>
            <Select
              value={selectedAdmin || ""}
              onValueChange={(value) => setValue("reportSentTo", value)}
              disabled={isLoadingAdmins}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingAdmins
                      ? "Loading admins..."
                      : admins.length === 0
                      ? "No admins available"
                      : "Select an admin"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {isLoadingAdmins ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading admins...
                  </div>
                ) : admins.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No admins found. Please contact system administrator.
                  </div>
                ) : (
                  admins.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.username} ({admin.phoneNumber})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.reportSentTo && (
              <p className="text-sm text-destructive">
                {errors.reportSentTo.message}
              </p>
            )}
            {!isLoadingAdmins && admins.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No admin users are available. Please ensure there are active
                admin users in the system.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="files">Attach Files (Optional)</Label>
            <Input
              id="files"
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {uploadedFiles.length > 0 && (
              <div className="space-y-2 mt-2">
                {uploadedFiles.map((filePreview, index) => (
                  <Card key={index}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{filePreview.file.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {(isSubmitting || isUploading) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Create Report
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
