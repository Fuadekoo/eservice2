"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { ArrowLeft, Loader2, Save, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { DaySchedule } from "@/lib/office-availability";

interface OfficeAvailability {
  id: string;
  officeId: string;
  defaultSchedule: Record<string, DaySchedule>;
  slotDuration: number;
  unavailableDateRanges: any[];
  unavailableDates: string[];
  dateOverrides: Record<string, DaySchedule>;
}

const DAYS = [
  { key: "0", label: "Sunday" },
  { key: "1", label: "Monday" },
  { key: "2", label: "Tuesday" },
  { key: "3", label: "Wednesday" },
  { key: "4", label: "Thursday" },
  { key: "5", label: "Friday" },
  { key: "6", label: "Saturday" },
];

export default function AvailabilityPage() {
  const params = useParams<{ lang: string }>();
  const router = useRouter();
  const lang = params.lang || "en";
  const [officeId, setOfficeId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<OfficeAvailability | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>({});
  const [slotDuration, setSlotDuration] = useState(30);

  // Fetch office ID and availability
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // First, get the manager's office
        const officeResponse = await fetch("/api/manager/office");
        const officeResult = await officeResponse.json();

        if (!officeResult.success || !officeResult.data) {
          toast.error("Failed to load office");
          return;
        }

        const office = officeResult.data;
        setOfficeId(office.id);

        // Then, get availability configuration
        const availabilityResponse = await fetch(
          `/api/office/${office.id}/availability`
        );
        const availabilityResult = await availabilityResponse.json();

        if (availabilityResult.config) {
          const config = availabilityResult.config;
          setAvailability({
            id: "",
            officeId: office.id,
            defaultSchedule: config.defaultSchedule || {},
            slotDuration: config.slotDuration || 30,
            unavailableDateRanges: config.unavailableDateRanges || [],
            unavailableDates: config.unavailableDates || [],
            dateOverrides: config.dateOverrides || {},
          });
          setSchedule(config.defaultSchedule || {});
          setSlotDuration(config.slotDuration || 30);
        }
      } catch (error: any) {
        console.error("Error fetching availability:", error);
        toast.error("Failed to load availability configuration");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const updateDaySchedule = (
    dayKey: string,
    field: keyof DaySchedule,
    value: string | boolean
  ) => {
    setSchedule((prev) => {
      const daySchedule = prev[dayKey] || {
        start: "09:00",
        end: "17:00",
        available: false,
      };
      return {
        ...prev,
        [dayKey]: {
          ...daySchedule,
          [field]: value,
        },
      };
    });
  };

  const handleSubmit = async () => {
    if (!officeId) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/office/${officeId}/availability`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          defaultSchedule: schedule,
          slotDuration: slotDuration,
          unavailableDateRanges: availability?.unavailableDateRanges || [],
          unavailableDates: availability?.unavailableDates || [],
          dateOverrides: availability?.dateOverrides || {},
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Availability updated successfully");
        setAvailability(result.availability);
      } else {
        toast.error(result.error || "Failed to update availability");
      }
    } catch (error: any) {
      console.error("Error updating availability:", error);
      toast.error("Failed to update availability");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${lang}/dashboard`);
  };

  if (isLoading) {
    return (
      <div className="w-full h-full overflow-y-auto py-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Office Availability
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure your office hours and availability
          </p>
        </div>
      </div>

      <div className="space-y-6 pb-6">
        {/* Slot Duration */}
        <Card>
          <CardHeader>
            <CardTitle>Slot Duration</CardTitle>
            <CardDescription>
              Set the duration for each appointment slot in minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Field>
              <FieldLabel>Duration (minutes)</FieldLabel>
              <Input
                type="number"
                min="15"
                max="120"
                step="15"
                value={slotDuration}
                onChange={(e) =>
                  setSlotDuration(parseInt(e.target.value) || 30)
                }
                className="max-w-xs"
              />
              <FieldDescription>
                Common values: 15, 30, 45, 60 minutes
              </FieldDescription>
            </Field>
          </CardContent>
        </Card>

        {/* Weekly Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>
              Set the working hours for each day of the week
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {DAYS.map((day) => {
              const daySchedule = schedule[day.key] || {
                start: "09:00",
                end: "17:00",
                available: false,
              };

              return (
                <div
                  key={day.key}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  <div className="w-24 flex-shrink-0">
                    <Label className="font-medium">{day.label}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={daySchedule.available}
                      onCheckedChange={(checked) =>
                        updateDaySchedule(day.key, "available", checked)
                      }
                    />
                    <span className="text-sm text-muted-foreground">
                      {daySchedule.available ? "Available" : "Closed"}
                    </span>
                  </div>
                  {daySchedule.available && (
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Start:</Label>
                        <Input
                          type="time"
                          value={daySchedule.start}
                          onChange={(e) =>
                            updateDaySchedule(day.key, "start", e.target.value)
                          }
                          className="w-32"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">End:</Label>
                        <Input
                          type="time"
                          value={daySchedule.end}
                          onChange={(e) =>
                            updateDaySchedule(day.key, "end", e.target.value)
                          }
                          className="w-32"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
