"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, X, FileText, Calendar, MapPin } from "lucide-react";
import Image from "next/image";
import { applyServiceSchema, ApplyServiceFormValues } from "./_schema";
import { useApplyServiceStore } from "./_store/apply-service-store";

export default function ApplyServicePage() {
  const params = useParams<{ lang: string }>();
  const router = useRouter();
  const lang = params.lang || "en";

  // Zustand store
  const {
    offices,
    services,
    selectedService,
    officeAvailability,
    files,
    isLoadingOffices,
    isLoadingServices,
    isLoadingAvailability,
    isSubmitting,
    fetchOffices,
    fetchServices,
    fetchServiceDetails,
    fetchOfficeAvailability,
    addFiles,
    removeFile,
    submitApplication,
    reset,
  } = useApplyServiceStore();

  const form = useForm({
    resolver: zodResolver(applyServiceSchema),
    defaultValues: {
      officeId: "",
      serviceId: "",
      currentAddress: "",
      date: new Date(),
      notes: "",
    },
  });

  const watchedOfficeId = form.watch("officeId");
  const watchedServiceId = form.watch("serviceId");

  // Fetch offices on mount
  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  // Fetch services when office is selected
  useEffect(() => {
    if (!watchedOfficeId) {
      form.setValue("serviceId", "");
      return;
    }
    fetchServices(watchedOfficeId);
  }, [watchedOfficeId, fetchServices, form]);

  // Fetch service details and availability when service is selected
  useEffect(() => {
    if (!watchedServiceId || !watchedOfficeId) {
      return;
    }
    fetchServiceDetails(watchedServiceId);
    fetchOfficeAvailability(watchedOfficeId);
  }, [
    watchedServiceId,
    watchedOfficeId,
    fetchServiceDetails,
    fetchOfficeAvailability,
  ]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;
    addFiles(Array.from(selectedFiles));
  };

  const handleSubmit = async (data: any) => {
    const formData: ApplyServiceFormValues = {
      officeId: data.officeId,
      serviceId: data.serviceId,
      currentAddress: data.currentAddress,
      date: data.date instanceof Date ? data.date : new Date(data.date),
      notes: data.notes,
    };
    const success = await submitApplication(formData);
    if (success) {
      router.push(`/${lang}/dashboard`);
    }
  };

  const DAYS = [
    { key: "0", label: "Sunday" },
    { key: "1", label: "Monday" },
    { key: "2", label: "Tuesday" },
    { key: "3", label: "Wednesday" },
    { key: "4", label: "Thursday" },
    { key: "5", label: "Friday" },
    { key: "6", label: "Saturday" },
  ];

  return (
    <div className="w-full h-full overflow-y-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Apply for Service</h1>
        <p className="text-muted-foreground mt-1">
          Fill in the details to apply for a service
        </p>
      </div>

      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 pb-6"
      >
        {/* Step 1: Select Office */}
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Select Office</CardTitle>
            <CardDescription>
              Choose the office you want to apply to
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Controller
              control={form.control}
              name="officeId"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Office *</FieldLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("serviceId", "");
                    }}
                    value={field.value}
                    disabled={isLoadingOffices || isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an office" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingOffices ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      ) : offices.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground">
                          No offices available
                        </div>
                      ) : (
                        offices.map((office) => (
                          <SelectItem key={office.id} value={office.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{office.name}</span>
                              <span className="text-xs text-muted-foreground">
                                Room {office.roomNumber} - {office.address}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {fieldState.error && (
                    <FieldDescription className="text-destructive">
                      {fieldState.error.message}
                    </FieldDescription>
                  )}
                </Field>
              )}
            />
          </CardContent>
        </Card>

        {/* Step 2: Select Service */}
        {watchedOfficeId && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Select Service</CardTitle>
              <CardDescription>
                Choose the service you want to apply for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                control={form.control}
                name="serviceId"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Service *</FieldLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoadingServices || isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingServices ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </div>
                        ) : services.length === 0 ? (
                          <div className="p-4 text-sm text-muted-foreground">
                            No services available for this office
                          </div>
                        ) : (
                          services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {service.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {service.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {fieldState.error && (
                      <FieldDescription className="text-destructive">
                        {fieldState.error.message}
                      </FieldDescription>
                    )}
                  </Field>
                )}
              />

              {/* Office Availability Display */}
              {watchedServiceId && officeAvailability && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Office Availability
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {DAYS.map((day) => {
                      const schedule =
                        officeAvailability.defaultSchedule[day.key];
                      if (!schedule) return null;
                      return (
                        <div key={day.key} className="flex items-center gap-2">
                          <Badge
                            variant={
                              schedule.available ? "default" : "secondary"
                            }
                          >
                            {day.label.substring(0, 3)}
                          </Badge>
                          {schedule.available && (
                            <span className="text-xs text-muted-foreground">
                              {schedule.start} - {schedule.end}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Slot Duration: {officeAvailability.slotDuration} minutes
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Requirements and Service For */}
        {selectedService && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Requirements & Service Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedService.requirements &&
                selectedService.requirements.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Requirements:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {selectedService.requirements.map((req) => (
                        <li key={req.id}>
                          <span className="font-medium">{req.name}</span>
                          {req.description && (
                            <span className="text-muted-foreground">
                              {" "}
                              - {req.description}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {selectedService.serviceFors &&
                selectedService.serviceFors.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Service For:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {selectedService.serviceFors.map((sf) => (
                        <li key={sf.id}>
                          <span className="font-medium">{sf.name}</span>
                          {sf.description && (
                            <span className="text-muted-foreground">
                              {" "}
                              - {sf.description}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Application Details */}
        {selectedService && (
          <Card>
            <CardHeader>
              <CardTitle>Step 4: Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                control={form.control}
                name="currentAddress"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Current Address *
                    </FieldLabel>
                    <Input
                      {...field}
                      placeholder="Enter your current address"
                      disabled={isSubmitting}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.error && (
                      <FieldDescription className="text-destructive">
                        {fieldState.error.message}
                      </FieldDescription>
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="date"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Preferred Date *
                    </FieldLabel>
                    <Input
                      type="date"
                      value={
                        field.value
                          ? new Date(field.value).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) => {
                        field.onChange(
                          e.target.value ? new Date(e.target.value) : new Date()
                        );
                      }}
                      disabled={isSubmitting}
                      aria-invalid={fieldState.invalid}
                      min={new Date().toISOString().split("T")[0]}
                    />
                    {fieldState.error && (
                      <FieldDescription className="text-destructive">
                        {fieldState.error.message}
                      </FieldDescription>
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="notes"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Notes (Optional)</FieldLabel>
                    <Textarea
                      {...field}
                      placeholder="Add any additional notes or information..."
                      rows={4}
                      disabled={isSubmitting}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.error && (
                      <FieldDescription className="text-destructive">
                        {fieldState.error.message}
                      </FieldDescription>
                    )}
                  </Field>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 5: File Upload */}
        {selectedService && (
          <Card>
            <CardHeader>
              <CardTitle>Step 5: Attach Files</CardTitle>
              <CardDescription>
                Upload PDF files or images (Max 10MB per file)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isSubmitting}
                />
                <label htmlFor="file-upload">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={isSubmitting}
                    asChild
                  >
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Files (PDF or Images)
                    </span>
                  </Button>
                </label>
              </div>

              {files.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {files.map((filePreview) => {
                    const isImage = filePreview.file.type.startsWith("image/");
                    return (
                      <div
                        key={filePreview.id}
                        className="relative border rounded-lg overflow-hidden"
                      >
                        {isImage ? (
                          <div className="relative aspect-square">
                            <Image
                              src={filePreview.preview}
                              alt={filePreview.file.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="aspect-square flex items-center justify-center bg-muted">
                            <FileText className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="p-2">
                          <p className="text-xs truncate">
                            {filePreview.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(filePreview.file.size / 1024 / 1024).toFixed(2)}{" "}
                            MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => removeFile(filePreview.id)}
                          disabled={isSubmitting}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        {selectedService && (
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
