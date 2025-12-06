"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Request } from "../_types";
import { Appointment } from "../_types";
import { cn } from "@/lib/utils";

interface AppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  requests: Request[];
  onSubmit: (data: {
    requestId: string;
    date: string;
    time?: string;
    notes?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function AppointmentForm({
  open,
  onOpenChange,
  appointment,
  requests,
  onSubmit,
  isSubmitting,
}: AppointmentFormProps) {
  const [requestId, setRequestId] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (appointment) {
      setRequestId(appointment.requestId);
      setSelectedDate(new Date(appointment.date));
      setTime(appointment.time || "");
      setNotes(appointment.notes || "");
    } else {
      setRequestId("");
      setSelectedDate(undefined);
      setTime("");
      setNotes("");
    }
  }, [appointment, open]);

  // Function to disable weekends (Saturday = 6, Sunday = 0)
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requestId || !selectedDate) {
      toast.error("Please select a request and appointment date");
      return;
    }

    // Double-check weekend selection (shouldn't happen but just in case)
    if (isWeekend(selectedDate)) {
      toast.error("Weekends (Saturday and Sunday) are not allowed");
      return;
    }

    try {
      await onSubmit({
        requestId,
        date: selectedDate.toISOString().split("T")[0],
        time: time || undefined,
        notes: notes || undefined,
      });
      toast.success(
        appointment
          ? "Appointment updated successfully"
          : "Appointment created successfully"
      );
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save appointment");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {appointment ? "Edit Appointment" : "Create Appointment"}
          </DialogTitle>
          <DialogDescription>
            {appointment
              ? "Update your appointment details"
              : "Schedule an appointment for an approved request (Weekends not available)"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="request">
              Request <span className="text-destructive">*</span>
            </Label>
            <Select
              value={requestId}
              onValueChange={setRequestId}
              disabled={!!appointment}
            >
              <SelectTrigger id="request">
                <SelectValue placeholder="Select a request" />
              </SelectTrigger>
              <SelectContent>
                {requests.map((req) => (
                  <SelectItem key={req.id} value={req.id}>
                    {req.service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Appointment Date <span className="text-destructive">*</span>
            </Label>
            <Popover modal={false}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto min-w-[360px] sm:min-w-[420px] md:min-w-[480px] p-4 sm:p-6 z-[100]"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  captionLayout="dropdown"
                  disabled={(date) => {
                    // Disable weekends (Saturday = 6, Sunday = 0)
                    if (isWeekend(date)) return true;
                    // Disable past dates
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  className="rounded-md border shadow-sm [--cell-size:3rem] sm:[--cell-size:3.75rem] md:[--cell-size:4.5rem]"
                  classNames={{
                    root: "w-full",
                    month: "w-full",
                    month_caption:
                      "text-base sm:text-lg md:text-xl font-semibold mb-4",
                    weekdays: "mb-3",
                    weekday:
                      "text-sm sm:text-base font-medium text-muted-foreground",
                    week: "gap-1 sm:gap-2",
                    day: "text-sm sm:text-base",
                    button_previous: "h-[--cell-size] w-[--cell-size]",
                    button_next: "h-[--cell-size] w-[--cell-size]",
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Saturdays and Sundays are not available
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Appointment Time (Optional)</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes for this appointment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {appointment ? "Updating..." : "Creating..."}
                </>
              ) : appointment ? (
                "Update Appointment"
              ) : (
                "Create Appointment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
