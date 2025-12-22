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
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useManagerReportStore } from "../_store/report-store";
import { toast } from "sonner";
import { FileText, Upload, X } from "lucide-react";
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
    getValues,
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
  });

  const selectedAdmins = watch("reportSentTo") || [];
  const [adminPopoverOpen, setAdminPopoverOpen] = useState(false);

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
          reportSentTo: data.reportSentTo, // Now an array of admin IDs
          files: files,
        }),
      });

      // Check if response is OK
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        // If response is not JSON, handle as error
        if (!response.ok) {
          throw new Error(`Failed to create report: ${response.status} ${response.statusText}`);
        } else {
          throw new Error("Invalid response from server");
        }
      }

      // Check if response was OK but result indicates failure
      if (!response.ok) {
        throw new Error(result.error || `Failed to create report: ${response.statusText}`);
      }
      if (!result.success) {
        // Handle warnings if some reports failed
        if (result.warnings && result.warnings.length > 0) {
          const warningMessage = result.warnings
            .map((w: any) => `Failed for ${w.adminUsername}`)
            .join(", ");
          toast.warning(
            `${result.message || "Partial success"}. Failed: ${warningMessage}`
          );
        } else {
          throw new Error(result.error || "Failed to create report");
        }
      }

      const reportCount = Array.isArray(result.data) ? result.data.length : 1;
      toast.success(
        result.message || `Report sent to ${reportCount} admin${reportCount > 1 ? "s" : ""} successfully`
      );
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
            {isLoadingAdmins ? (
              <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2 border rounded-md">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading admins...
              </div>
            ) : admins.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground border rounded-md">
                No admins found. Please contact system administrator.
              </div>
            ) : (
              <Popover open={adminPopoverOpen} onOpenChange={setAdminPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={adminPopoverOpen}
                    className={cn(
                      "w-full justify-between",
                      selectedAdmins.length === 0 && "text-muted-foreground",
                      errors.reportSentTo && "border-destructive"
                    )}
                  >
                    {selectedAdmins.length === 0
                      ? "Select admin(s)..."
                      : selectedAdmins.length === 1
                      ? admins.find((admin) => admin.id === selectedAdmins[0])
                          ?.username || "1 admin selected"
                      : `${selectedAdmins.length} admins selected`}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search admins..." />
                    <CommandList className="max-h-[300px] overflow-y-auto">
                      <CommandEmpty>No admin found.</CommandEmpty>
                      <CommandGroup>
                        {admins.map((admin) => {
                          const isSelected = selectedAdmins.includes(admin.id);
                          return (
                            <CommandItem
                              key={admin.id}
                              value={`${admin.username} ${admin.phoneNumber}`}
                              onSelect={() => {
                                const current = getValues("reportSentTo") || [];
                                if (isSelected) {
                                  const updated = current.filter((id) => id !== admin.id);
                                  setValue("reportSentTo", updated, { shouldValidate: true });
                                } else {
                                  const updated = [...current, admin.id];
                                  setValue("reportSentTo", updated, { shouldValidate: true });
                                }
                              }}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="font-medium">{admin.username}</span>
                                <span className="text-xs text-muted-foreground">
                                  {admin.phoneNumber}
                                </span>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
            {errors.reportSentTo && (
              <p className="text-sm text-destructive">
                {errors.reportSentTo.message}
              </p>
            )}
            {!isLoadingAdmins && selectedAdmins.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedAdmins.length} admin{selectedAdmins.length > 1 ? "s" : ""} selected
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
