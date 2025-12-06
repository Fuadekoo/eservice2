"use client";

import { useState, useEffect } from "react";
import { Appointment } from "../_types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Clock,
  MapPin,
  Building2,
  Edit,
  Loader2,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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

interface AppointmentDetailProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (
    id: string,
    data: { date?: string; time?: string; notes?: string }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isSubmitting: boolean;
}

const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  completed: "default",
  cancelled: "destructive",
};

export function AppointmentDetail({
  appointment,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  isSubmitting,
}: AppointmentDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Check if appointment is approved or completed
  const isAppointmentApproved = appointment 
    ? (appointment.status === "approved" || appointment.status === "completed")
    : false;
  const canEdit = !isAppointmentApproved;
  const canDelete = !isAppointmentApproved;

  // Function to disable weekends (Saturday = 6, Sunday = 0)
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  };

  useEffect(() => {
    if (appointment) {
      setSelectedDate(new Date(appointment.date));
      setTime(appointment.time || "");
      setNotes(appointment.notes || "");
      setIsEditing(false);
    }
  }, [appointment, open]);

  const handleSave = async () => {
    if (!appointment || !selectedDate) return;

    // Double-check weekend selection (shouldn't happen but just in case)
    if (isWeekend(selectedDate)) {
      // Error will be shown by parent via toast
      return;
    }

    try {
      await onUpdate(appointment.id, {
        date: selectedDate.toISOString().split("T")[0],
        time: time || undefined,
        notes: notes || undefined,
      });
      setIsEditing(false);
    } catch (error) {
      // Error handling is done in parent
    }
  };

  const handleDelete = async () => {
    if (!appointment) return;
    await onDelete(appointment.id);
    setIsDeleteDialogOpen(false);
  };

  if (!appointment) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl sm:max-w-3xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">
                  {appointment.request.service.name}
                </DialogTitle>
                <DialogDescription>Appointment Details</DialogDescription>
              </div>
              <Badge variant={statusColors[appointment.status] || "secondary"}>
                {appointment.status}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {!isEditing ? (
              <>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {format(new Date(appointment.date), "PPP")}
                    {appointment.time && ` at ${appointment.time}`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span>{appointment.request.service.office.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {appointment.request.service.office.address}, Room{" "}
                    {appointment.request.service.office.roomNumber}
                  </span>
                </div>

                {appointment.approveStaff && (
                  <div className="text-sm text-muted-foreground">
                    Assigned to: {appointment.approveStaff.user.username} (
                    {appointment.approveStaff.user.phoneNumber})
                  </div>
                )}

                {appointment.notes && (
                  <div className="pt-4 border-t">
                    <strong>Notes:</strong>
                    <p className="text-muted-foreground mt-1">
                      {appointment.notes}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => setIsEditing(true)}
                    disabled={!canEdit}
                    title={!canEdit ? "Cannot edit approved or completed appointment" : "Edit appointment"}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={!canDelete}
                    title={!canDelete ? "Cannot delete approved or completed appointment" : "Delete appointment"}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
                {(!canEdit || !canDelete) && (
                  <p className="text-xs text-muted-foreground pt-2">
                    This appointment cannot be edited or deleted because it has been approved or completed.
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Appointment Date</Label>
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
                          month_caption: "text-base sm:text-lg md:text-xl font-semibold mb-4",
                          weekdays: "mb-3",
                          weekday: "text-sm sm:text-base font-medium text-muted-foreground",
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
                  <Label htmlFor="edit-time">Appointment Time</Label>
                  <Input
                    id="edit-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this appointment? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

