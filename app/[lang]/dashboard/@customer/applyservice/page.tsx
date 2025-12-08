"use client";

import { useEffect, useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Loader2, Upload, X, FileText, Calendar, MapPin, CheckCircle2, Building2, List, FileCheck } from "lucide-react";
import Image from "next/image";
import { applyServiceSchema, ApplyServiceFormValues } from "./_schema";
import { useApplyServiceStore } from "./_store/apply-service-store";
import useTranslation from "@/hooks/useTranslation";

export default function ApplyServicePage() {
  const { t } = useTranslation();
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
  const [showSuccess, setShowSuccess] = useState(false);

  // Calculate current step for progress
  const getCurrentStep = () => {
    if (!watchedOfficeId) return 1;
    if (!watchedServiceId) return 2;
    if (!selectedService) return 3;
    if (!form.watch("currentAddress") || !form.watch("date")) return 4;
    return 5;
  };

  const currentStep = getCurrentStep();
  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  // Steps definition
  const STEPS = [
    { id: 1, title: t("dashboard.selectOffice"), icon: Building2, completed: !!watchedOfficeId },
    { id: 2, title: t("dashboard.selectService"), icon: FileText, completed: !!watchedServiceId },
    { id: 3, title: t("dashboard.viewInformation"), icon: List, completed: !!selectedService },
    { id: 4, title: t("dashboard.applicationDetails"), icon: FileCheck, completed: !!(form.watch("currentAddress") && form.watch("date")) },
    { id: 5, title: t("dashboard.uploadFiles"), icon: Upload, completed: files.length > 0 },
  ];

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
      setShowSuccess(true);
      // Auto-hide after 3 seconds and redirect
      setTimeout(() => {
        setShowSuccess(false);
        router.push(`/${lang}/dashboard/request`);
      }, 3000);
    }
  };

  const DAYS = [
    { key: "0", label: t("dashboard.sunday") },
    { key: "1", label: t("dashboard.monday") },
    { key: "2", label: t("dashboard.tuesday") },
    { key: "3", label: t("dashboard.wednesday") },
    { key: "4", label: t("dashboard.thursday") },
    { key: "5", label: t("dashboard.friday") },
    { key: "6", label: t("dashboard.saturday") },
  ];

  return (
    <div className="w-full h-dvh overflow-y-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.applyForService")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("dashboard.fillDetailsToApply")}
        </p>
      </div>

      {/* Progress Indicator */}
      <Card className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{t("dashboard.progress")}</span>
                <span className="text-muted-foreground">{currentStep} {t("dashboard.of")} {totalSteps} {t("dashboard.steps")}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Steps Indicator */}
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = step.completed || currentStep > step.id;

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isActive
                            ? "bg-primary text-primary-foreground scale-110 shadow-lg"
                            : isCompleted
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <StepIcon className="w-5 h-5" />
                        )}
                      </div>
                      <p
                        className={`text-xs mt-2 text-center max-w-[80px] ${
                          isActive ? "font-medium text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`h-1 flex-1 mx-2 transition-colors ${
                          isCompleted ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 pb-6"
      >
        {/* Step 1: Select Office */}
        <Card className="transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className={`w-5 h-5 ${watchedOfficeId ? 'text-primary' : ''}`} />
              {t("dashboard.step1")}: {t("dashboard.selectOffice")}
            </CardTitle>
            <CardDescription>
              {t("dashboard.chooseOfficeToApply")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Controller
              control={form.control}
              name="officeId"
              render={({ field, fieldState }) => (
                  <Field>
                  <FieldLabel>{t("navigation.office")} *</FieldLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("serviceId", "");
                    }}
                    value={field.value}
                    disabled={isLoadingOffices || isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("dashboard.selectAnOffice")} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingOffices ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      ) : offices.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground">
                          {t("dashboard.noOfficesAvailable")}
                        </div>
                      ) : (
                        offices.map((office) => (
                          <SelectItem key={office.id} value={office.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{office.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {t("dashboard.room")} {office.roomNumber} - {office.address}
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
          <Card className="transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className={`w-5 h-5 ${watchedServiceId ? 'text-primary' : ''}`} />
                {t("dashboard.step2")}: {t("dashboard.selectService")}
              </CardTitle>
              <CardDescription>
                {t("dashboard.chooseServiceToApply")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                control={form.control}
                name="serviceId"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>{t("dashboard.service")} *</FieldLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoadingServices || isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("dashboard.selectAService")} />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingServices ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </div>
                        ) : services.length === 0 ? (
                          <div className="p-4 text-sm text-muted-foreground">
                            {t("dashboard.noServicesAvailableForOffice")}
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
                    {t("dashboard.officeAvailability")}
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
                    {t("dashboard.slotDuration")}: {officeAvailability.slotDuration} {t("dashboard.minutes")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Requirements and Service For */}
        {selectedService && (
          <Card className="transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="w-5 h-5 text-primary" />
                {t("dashboard.step3")}: {t("dashboard.requirementsAndServiceInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedService.requirements &&
                selectedService.requirements.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">{t("dashboard.requirements")}:</h4>
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
                    <h4 className="font-medium mb-2">{t("dashboard.serviceFor")}:</h4>
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
          <Card className="transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-primary" />
                {t("dashboard.step4")}: {t("dashboard.applicationDetails")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                control={form.control}
                name="currentAddress"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {t("dashboard.currentAddress")} *
                    </FieldLabel>
                    <Input
                      {...field}
                      placeholder={t("dashboard.enterCurrentAddress")}
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
                      {t("dashboard.preferredDate")} *
                    </FieldLabel>
                    <Input
                      type="date"
                      value={
                        field.value && field.value instanceof Date
                          ? field.value.toISOString().split("T")[0]
                          : field.value
                          ? new Date(field.value as string | number | Date)
                              .toISOString()
                              .split("T")[0]
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
                    <FieldLabel>{t("dashboard.notesOptional")}</FieldLabel>
                    <Textarea
                      {...field}
                      placeholder={t("dashboard.addAdditionalNotes")}
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
          <Card className="transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                {t("dashboard.step5")}: {t("dashboard.attachFiles")}
              </CardTitle>
              <CardDescription>
                {t("dashboard.uploadFilesDescription")}
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
                      {t("dashboard.chooseFiles")}
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
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("dashboard.submitting")}
                </>
              ) : (
                t("dashboard.submitApplication")
              )}
            </Button>
          </div>
        )}
      </form>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t("dashboard.requestSubmittedSuccessfully")}</h2>
            <p className="text-muted-foreground">
              {t("dashboard.requestSubmittedMessage")}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
