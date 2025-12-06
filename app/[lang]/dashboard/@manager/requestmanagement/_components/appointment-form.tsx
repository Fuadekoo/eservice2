"use client";

import { useState } from "react";
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
import { Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Staff {
  id: string;
  userName?: string;
  username?: string;
  userPhone?: string;
  phoneNumber?: string;
}

interface AppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  staffList: Staff[];
  onSuccess: () => void;
}

export function AppointmentForm({
  open,
  onOpenChange,
  requestId,
  staffList,
  onSuccess,
}: AppointmentFormProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      toast.error("Please select an appointment date");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/appointment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          date,
          time: time || undefined,
          notes: notes || undefined,
          staffId: selectedStaffId || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Appointment created successfully");
        onSuccess();
        // Reset form
        setDate("");
        setTime("");
        setNotes("");
        setSelectedStaffId("");
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to create appointment");
      }
    } catch (error: any) {
      console.error("Error creating appointment:", error);
      toast.error(error.message || "Failed to create appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Create Appointment
          </DialogTitle>
          <DialogDescription>
            Schedule an appointment for this approved request
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">
              Appointment Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              required
            />
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

          {staffList.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="staff">Assign to Staff (Optional)</Label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger id="staff">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.userName || staff.username} -{" "}
                      {staff.userPhone || staff.phoneNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
                  Creating...
                </>
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

