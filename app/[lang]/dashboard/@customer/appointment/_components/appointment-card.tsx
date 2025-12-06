"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Building2, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Appointment } from "../_types";

interface AppointmentCardProps {
  appointment: Appointment;
  onClick?: (appointment: Appointment) => void;
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointment: Appointment) => void;
}

const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  completed: "default",
  cancelled: "destructive",
};

export function AppointmentCard({
  appointment,
  onClick,
  onEdit,
  onDelete,
}: AppointmentCardProps) {
  // Check if appointment is approved or completed
  const isAppointmentApproved = appointment.status === "approved" || appointment.status === "completed";
  const canEdit = !isAppointmentApproved;
  const canDelete = !isAppointmentApproved;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on buttons
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).tagName === "BUTTON"
    ) {
      return;
    }
    onClick?.(appointment);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEdit) {
      return;
    }
    onEdit(appointment);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canDelete) {
      return;
    }
    onDelete(appointment);
  };

  return (
    <Card className={onClick ? "cursor-pointer hover:shadow-lg transition-shadow" : ""} onClick={handleCardClick}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              {appointment.request.service.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={statusColors[appointment.status] || "secondary"}>
                {appointment.status}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              disabled={!canEdit}
              title={!canEdit ? "Cannot edit approved or completed appointment" : "Edit appointment"}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={!canDelete}
              className="text-destructive hover:text-destructive"
              title={!canDelete ? "Cannot delete approved or completed appointment" : "Delete appointment"}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>{format(new Date(appointment.date), "PPP")}</span>
          {appointment.time && (
            <>
              <Clock className="w-4 h-4 text-muted-foreground ml-2" />
              <span>{appointment.time}</span>
            </>
          )}
        </div>

        {appointment.request.service.office && (
          <>
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span>{appointment.request.service.office.name}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>
                {appointment.request.service.office.address}, Room{" "}
                {appointment.request.service.office.roomNumber}
              </span>
            </div>
          </>
        )}

        {appointment.approveStaff && (
          <div className="text-sm text-muted-foreground">
            Assigned to: {appointment.approveStaff.user.username}
          </div>
        )}

        {appointment.notes && (
          <div className="text-sm text-muted-foreground pt-2 border-t">
            <strong>Notes:</strong> {appointment.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

