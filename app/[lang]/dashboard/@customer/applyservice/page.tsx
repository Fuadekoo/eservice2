"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { OfficeCombobox } from "./_components/office-combobox";
import { ServiceCombobox } from "./_components/service-combobox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Loader2,
  Upload,
  X,
  FileText,
  Calendar,
  MapPin,
  CheckCircle2,
  Building2,
  List,
  FileCheck,
} from "lucide-react";
import Image from "next/image";
import { applyServiceSchema, ApplyServiceFormValues } from "./_schema";
import { useApplyServiceStore } from "./_store/apply-service-store";
import useTranslation from "@/hooks/useTranslation";

export default function ApplyServicePage() {
  const { t } = useTranslation();
  const tr = (key: string, fallback: string) => {
    const value = t(key);
    return !value || value === key ? fallback : value;
  };
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
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [slotFilter, setSlotFilter] = useState<string>("all");
  const [slotError, setSlotError] = useState<string>("");

  // Calculate current step for simplified 3-step progress
  const getCurrentStep = () => {
    // Step 1: Service Details (office/service selection + info)
    if (!watchedOfficeId || !watchedServiceId || !selectedService) return 1;
    // Step 2: Application Form (until submission success)
    if (!showSuccess) return 2;
    // Step 3: Confirmation
    return 3;
  };

  const currentStep = getCurrentStep();
  const totalSteps = 3;

  // Scroll progress (fills the thin bar under the banner)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollPercent, setScrollPercent] = useState<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      const pct = max > 0 ? (el.scrollTop / max) * 100 : 0;
      setScrollPercent(Math.min(100, Math.max(0, pct)));
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Steps definition
  const STEPS = [
    {
      id: 1,
      title: t("dashboard.serviceDetails") || "Service Details",
      icon: FileText,
      completed: !!selectedService,
    },
    {
      id: 2,
      title:
        t("dashboard.applicationForm") ||
        t("dashboard.applicationDetails") ||
        "Application Form",
      icon: FileCheck,
      completed:
        !!form.watch("currentAddress") &&
        !!form.watch("date") &&
        files.length > 0,
    },
    {
      id: 3,
      title: t("dashboard.confirmation") || "Confirmation",
      icon: CheckCircle2,
      completed: showSuccess,
    },
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
      notes: selectedSlot
        ? `${
            (t("dashboard.preferredTime") || "Preferred time") + ": "
          }${selectedSlot}${data.notes ? " | " + data.notes : ""}`
        : data.notes,
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

  // Fetch available time slots when office/date selected
  useEffect(() => {
    const fetchSlots = async () => {
      setSlotError("");
      setAvailableSlots([]);
      setSelectedSlot("");
      if (!watchedOfficeId || !form.getValues("date")) return;
      try {
        setSlotsLoading(true);
        const d = form.getValues("date") as unknown;
        let dateObj: Date;
        if (d instanceof Date) {
          dateObj = d;
        } else if (typeof d === "string" || typeof d === "number") {
          dateObj = new Date(d);
        } else {
          dateObj = new Date();
        }
        const dateStr = dateObj.toISOString().split("T")[0];
        const res = await fetch(
          `/api/office/${watchedOfficeId}/availability/slots?date=${dateStr}`
        );
        const json = await res.json();
        if (res.ok && json?.availableSlots) {
          setAvailableSlots(json.availableSlots as string[]);
        } else {
          setSlotError(json?.error || "No slots available for selected date");
        }
      } catch (e: any) {
        setSlotError(e.message || "Failed to load slots");
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedOfficeId, form.watch("date")]);

  // Group slots into time-of-day categories similar to the reference UI
  const categoryDefs = useMemo(
    () => [
      { key: "midnight", label: "Midnight", start: 0, end: 330 }, // 00:00 - 05:30
      { key: "fajr", label: "Fajr", start: 330, end: 420 }, // 05:30 - 07:00
      {
        key: "morning",
        label: t("dashboard.morning") || "Morning",
        start: 420,
        end: 720,
      }, // 07:00-12:00
      { key: "zuhur", label: "Zuhur", start: 720, end: 900 }, // 12:00-15:00
      { key: "asr", label: "Asr", start: 900, end: 1020 }, // 15:00-17:00
      { key: "maghrib", label: "Maghrib", start: 1020, end: 1140 }, // 17:00-19:00
      { key: "isha", label: "Isha", start: 1140, end: 1440 }, // 19:00-24:00
    ],
    [t]
  );

  const categorizedSlots = useMemo(() => {
    const toMinutes = (time: string) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };
    const byCategory: Record<string, string[]> = {};
    categoryDefs.forEach((c) => (byCategory[c.key] = []));
    availableSlots.forEach((s) => {
      const mins = toMinutes(s);
      const cat = categoryDefs.find((c) => mins >= c.start && mins < c.end);
      if (cat) byCategory[cat.key].push(s);
    });
    return byCategory;
  }, [availableSlots, categoryDefs]);

  return (
    <div
      ref={containerRef}
      className="w-full h-dvh overflow-y-auto py-4 sm:py-6 space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8"
    >
      {/* Gradient Progress Banner (sticky) */}
      <div className="sticky top-0 z-20">
        <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white bg-linear-to-r from-teal-600 via-sky-600 to-indigo-600 shadow">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 ring-2 ring-white/30 flex items-center justify-center">
                <Image src="/favicon.ico" alt="Logo" width={28} height={28} />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold leading-tight">
                  {t("dashboard.applyForService")}
                </h1>
                <p className="text-xs sm:text-sm text-white/80">
                  {t("dashboard.fillDetailsToApply")}
                </p>
              </div>
            </div>

            {/* Step pill with dots */}
            <div className="shrink-0 bg-white/20 text-white/95 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="text-xs sm:text-sm font-medium">
                  {t("dashboard.step") || "Step"} {currentStep}{" "}
                  {t("dashboard.of") || "of"} {totalSteps}
                </span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`inline-block w-2.5 h-2.5 rounded-full ${
                        i <= currentStep ? "bg-emerald-300" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Thin scroll progress bar */}
          <div className="mt-3 sm:mt-4 h-2 rounded-full bg-white/25 overflow-hidden">
            <div
              className="h-2 rounded-full bg-emerald-300"
              style={{ width: `${scrollPercent}%` }}
              aria-hidden
            />
          </div>
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 pb-6"
      >
        {/* Step 1: Select Office */}
        <Card className="transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2
                className={`w-5 h-5 ${watchedOfficeId ? "text-primary" : ""}`}
              />
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
                  {isLoadingOffices ? (
                    <div className="flex items-center justify-center p-4 border rounded-md">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : (
                    <OfficeCombobox
                      offices={offices}
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("serviceId", "");
                      }}
                      placeholder={t("dashboard.selectAnOffice")}
                      disabled={isSubmitting}
                      error={!!fieldState.error}
                    />
                  )}
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
                <FileText
                  className={`w-5 h-5 ${
                    watchedServiceId ? "text-primary" : ""
                  }`}
                />
                {t("dashboard.step2")}: {t("dashboard.selectService")}
              </CardTitle>
              <CardDescription>
                {t("dashboard.chooseServiceToApply")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preferred Time Slot Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">
                    {tr(
                      "dashboard.selectPreferredTimeSlot",
                      "Select Preferred Time Slot"
                    )}
                  </h4>
                </div>

                {/* Slots content */}
                <div className="space-y-3">
                  {slotsLoading && (
                    <div className="p-4 border rounded-md flex items-center gap-2 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("dashboard.loadingSlots") ||
                        "Loading available time slots..."}
                    </div>
                  )}
                  {!slotsLoading && slotError && (
                    <div className="p-4 border rounded-md text-sm text-destructive bg-destructive/5">
                      {slotError}
                    </div>
                  )}

                  {!slotsLoading && availableSlots.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {(slotFilter === "all"
                        ? categoryDefs
                        : categoryDefs.filter((c) => c.key === slotFilter)
                      ).map((cat) => {
                        const slots = categorizedSlots[cat.key] || [];
                        if (slots.length === 0) return null;
                        return (
                          <Card key={cat.key} className="border rounded-xl">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                                {cat.label}
                              </CardTitle>
                              <CardDescription>
                                {t("dashboard.available") || "Available"}:{" "}
                                {slots.length}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-3">
                              {slots.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setSelectedSlot(s)}
                                  className={`text-left border rounded-lg px-3 py-3 transition shadow-sm hover:shadow ${
                                    selectedSlot === s
                                      ? "border-primary ring-2 ring-primary/30"
                                      : "border-muted"
                                  }`}
                                >
                                  <div className="font-semibold">{s}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {t("dashboard.available") || "Available"}
                                  </div>
                                </button>
                              ))}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <Controller
                control={form.control}
                name="serviceId"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>{t("dashboard.service")} *</FieldLabel>
                    {isLoadingServices ? (
                      <div className="flex items-center justify-center p-4 border rounded-md">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    ) : services.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground border rounded-md">
                        {t("dashboard.noServicesAvailableForOffice")}
                      </div>
                    ) : (
                      <ServiceCombobox
                        services={services}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={t("dashboard.selectAService")}
                        disabled={isSubmitting}
                        error={!!fieldState.error}
                      />
                    )}
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
                    {t("dashboard.slotDuration")}:{" "}
                    {officeAvailability.slotDuration} {t("dashboard.minutes")}
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
                {t("dashboard.step3")}:{" "}
                {t("dashboard.requirementsAndServiceInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedService.requirements &&
                selectedService.requirements.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">
                      {t("dashboard.requirements")}:
                    </h4>
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
                    <h4 className="font-medium mb-2">
                      {t("dashboard.serviceFor")}:
                    </h4>
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
            <h2 className="text-2xl font-bold mb-2">
              {t("dashboard.requestSubmittedSuccessfully")}
            </h2>
            <p className="text-muted-foreground">
              {t("dashboard.requestSubmittedMessage")}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
