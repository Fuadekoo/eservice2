"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerRequestSchema, CustomerRequestFormValues } from "../_schema";
import { Service, Office, OfficeAvailability } from "../_types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, Building2, FileText, CheckCircle2, Clock, Upload, X, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface MultiStepRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CustomerRequestFormValues & { files: File[] }) => Promise<void>;
  offices: Office[];
  services: Service[];
  selectedOffice: string | null;
  selectedService: string | null;
  onOfficeChange: (officeId: string) => void;
  onServiceChange: (serviceId: string) => void;
  fetchServices: (officeId: string) => Promise<void>;
  isSubmitting: boolean;
}

const STEPS = [
  { id: 1, title: "Select Office", icon: Building2 },
  { id: 2, title: "Select Service", icon: FileText },
  { id: 3, title: "Service Info", icon: CheckCircle2 },
  { id: 4, title: "Availability", icon: CalendarIcon },
  { id: 5, title: "Request Details", icon: FileText },
  { id: 6, title: "Upload Files", icon: Upload },
  { id: 7, title: "Review", icon: CheckCircle2 },
];

export function MultiStepRequestForm({
  open,
  onOpenChange,
  onSubmit,
  offices,
  services,
  selectedOffice,
  selectedService,
  onOfficeChange,
  onServiceChange,
  fetchServices,
  isSubmitting,
}: MultiStepRequestFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [availability, setAvailability] = useState<OfficeAvailability | null>(null);
  const [availabilityConfig, setAvailabilityConfig] = useState<any>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [files, setFiles] = useState<File[]>([]);
  const [fileDescriptions, setFileDescriptions] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  const selectedServiceData = services.find((s) => s.id === selectedService);
  const selectedOfficeData = offices.find((o) => o.id === selectedOffice);

  const form = useForm({
    resolver: zodResolver(customerRequestSchema),
    defaultValues: {
      serviceId: "",
      currentAddress: "",
      date: new Date(),
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        serviceId: "",
        currentAddress: "",
        date: new Date(),
      });
      setCurrentStep(1);
      setFiles([]);
      setFileDescriptions({});
      setSelectedDate(undefined);
    }
  }, [open, form]);

  // Update form when service is selected
  useEffect(() => {
    if (selectedService) {
      form.setValue("serviceId", selectedService);
    }
  }, [selectedService, form]);

  // Fetch availability config when entering step 4
  useEffect(() => {
    if (currentStep === 4 && selectedOffice) {
      fetchAvailabilityConfig();
    }
  }, [currentStep, selectedOffice]);

  // Auto-select today or next working day and fetch availability
  useEffect(() => {
    if (currentStep === 4 && selectedOffice && availabilityConfig && !selectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWorkingDay = getNextWorkingDay(today, availabilityConfig);
      setSelectedDate(nextWorkingDay);
      form.setValue("date", nextWorkingDay);
      fetchAvailability(selectedOffice, nextWorkingDay);
    }
  }, [currentStep, selectedOffice, availabilityConfig]);

  // Fetch availability when date changes
  useEffect(() => {
    if (currentStep === 4 && selectedOffice && selectedDate && availabilityConfig) {
      fetchAvailability(selectedOffice, selectedDate);
    }
  }, [selectedDate]);

  const fetchAvailabilityConfig = async () => {
    if (!selectedOffice) return;
    setLoadingAvailability(true);
    try {
      const response = await fetch(`/api/office/${selectedOffice}/availability`);
      const data = await response.json();
      setAvailabilityConfig(data.config || data);
    } catch (error) {
      console.error("Error fetching availability config:", error);
      toast.error("Failed to load availability configuration");
    } finally {
      setLoadingAvailability(false);
    }
  };

  const fetchAvailability = async (officeId: string, date: Date) => {
    setLoadingAvailability(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const response = await fetch(`/api/office/${officeId}/availability?date=${dateStr}`);
      const data = await response.json();
      setAvailability(data);
    } catch (error) {
      console.error("Error fetching availability:", error);
      toast.error("Failed to load availability");
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Get next working day based on availability schedule
  const getNextWorkingDay = (date: Date, config: any): Date => {
    const defaultSchedule = config?.defaultSchedule || {};
    let checkDate = new Date(date);
    let attempts = 0;
    const maxAttempts = 14; // Check up to 2 weeks ahead

    while (attempts < maxAttempts) {
      const dayOfWeek = checkDate.getDay().toString();
      const daySchedule = defaultSchedule[dayOfWeek];
      
      // Check if this day is available
      if (daySchedule && daySchedule.available) {
        return checkDate;
      }

      // Move to next day
      checkDate = new Date(checkDate);
      checkDate.setDate(checkDate.getDate() + 1);
      attempts++;
    }

    // Fallback to today if no working day found
    return date;
  };

  // Check if a date is a working day
  const isWorkingDay = (date: Date): boolean => {
    if (!availabilityConfig?.defaultSchedule) return true;
    const dayOfWeek = date.getDay().toString();
    const daySchedule = availabilityConfig.defaultSchedule[dayOfWeek];
    return daySchedule?.available === true;
  };

  const handleOfficeSelect = async (officeId: string) => {
    onOfficeChange(officeId);
    await fetchServices(officeId);
    setCurrentStep(2);
  };

  const handleServiceSelect = (serviceId: string) => {
    onServiceChange(serviceId);
    setCurrentStep(3);
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      form.setValue("date", date);
      if (selectedOffice) {
        fetchAvailability(selectedOffice, date);
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileRemove = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const removedFile = newFiles.splice(index, 1)[0];
      const newDescriptions = { ...fileDescriptions };
      delete newDescriptions[removedFile.name];
      setFileDescriptions(newDescriptions);
      return newFiles;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleSubmit = async (data: CustomerRequestFormValues) => {
    await onSubmit({ ...data, files });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!selectedOffice;
      case 2:
        return !!selectedService;
      case 3:
        return true;
      case 4:
        return !!selectedDate;
      case 5:
        return form.formState.isValid;
      case 6:
        return true; // Files are optional
      case 7:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select the office where you want to request a service
            </p>
            <Select
              value={selectedOffice || ""}
              onValueChange={handleOfficeSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an office" />
              </SelectTrigger>
              <SelectContent>
                {offices.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No offices available
                  </div>
                ) : (
                  offices.map((office) => (
                    <SelectItem key={office.id} value={office.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{office.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {office.address} - Room {office.roomNumber}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a service from {selectedOfficeData?.name || "the selected office"}
            </p>
            <Select
              value={selectedService || ""}
              onValueChange={handleServiceSelect}
              disabled={!selectedOffice || services.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !selectedOffice 
                    ? "Please select an office first"
                    : services.length === 0
                    ? "No services available"
                    : "Select a service"
                } />
              </SelectTrigger>
              <SelectContent>
                {services.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    {!selectedOffice 
                      ? "Please select an office first"
                      : "No services available for this office"}
                  </div>
                ) : (
                  services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{service.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {service.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Service Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedServiceData?.name}</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedServiceData?.description}
                  </p>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Office Details</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Office:</span> {selectedServiceData?.office.name}
                    </p>
                    <p>
                      <span className="font-medium">Address:</span> {selectedServiceData?.office.address}
                    </p>
                    <p>
                      <span className="font-medium">Room:</span> {selectedServiceData?.office.roomNumber}
                    </p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Requirements</h4>
                  <p className="text-sm text-muted-foreground">
                    Please ensure you have all necessary documents and information ready before proceeding.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        // Function to check if a date is a weekend (Saturday = 6, Sunday = 0)
        const isWeekend = (date: Date) => {
          const day = date.getDay();
          return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
        };

        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              View availability for working days
            </p>
            <div className="flex flex-col md:flex-row gap-6">
              <div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => {
                    // Disable past dates
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (date < today) return true;
                    // Disable weekends (Saturday and Sunday)
                    return isWeekend(date);
                  }}
                  className="rounded-md border"
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Only working days are shown (Monday - Friday)
                </p>
              </div>
              <div className="flex-1">
                {selectedDate ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Availability for {format(selectedDate, "PPP")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingAvailability ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      ) : availability?.availableSlots && availability.availableSlots.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {availability.availableSlots.map((slot, idx) => {
                            const slotTime = typeof slot === 'string' ? slot : slot.start || slot;
                            return (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="justify-center p-2"
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {slotTime}
                              </Badge>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No available slots for this date
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-8">
                      <p className="text-sm text-muted-foreground text-center">
                        Click on a date in the calendar to view availability
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <Controller
              control={form.control}
              name="currentAddress"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Current Address *</FieldLabel>
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
                  <FieldLabel>Request Date *</FieldLabel>
                  <Input
                    type="date"
                    value={
                      field.value
                        ? format(new Date(field.value), "yyyy-MM-dd")
                        : ""
                    }
                    onChange={(e) => {
                      const dateValue = e.target.value
                        ? new Date(e.target.value)
                        : new Date();
                      field.onChange(dateValue);
                    }}
                    min={format(new Date(), "yyyy-MM-dd")}
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
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                Click or drag files here to upload
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, DOC, DOCX, Images (Max 10MB per file)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
            />

            {files.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Uploaded Files ({files.length})</h4>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileRemove(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Review Your Request</CardTitle>
                <CardDescription>
                  Please review all information before submitting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Office</h4>
                  <p className="text-sm">{selectedOfficeData?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedOfficeData?.address}
                  </p>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Service</h4>
                  <p className="text-sm">{selectedServiceData?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedServiceData?.description}
                  </p>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Request Details</h4>
                  <p className="text-sm">
                    <span className="font-medium">Address:</span> {form.watch("currentAddress")}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Date:</span>{" "}
                    {form.watch("date")
                      ? format(new Date(form.watch("date")), "PPP")
                      : "Not selected"}
                  </p>
                </div>
                {files.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Files ({files.length})</h4>
                    <ul className="text-sm space-y-1">
                      {files.map((file, idx) => (
                        <li key={idx} className="text-muted-foreground">
                          • {file.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Request</DialogTitle>
          <DialogDescription>
            Follow the steps to create a service request
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
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
                    className={`text-xs mt-2 text-center ${
                      isActive ? "font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      isCompleted ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-3 mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
            >
              Back
            </Button>
            {currentStep < STEPS.length ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
              >
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={!canProceed() || isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Request
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

