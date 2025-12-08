"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Loader2, RefreshCw, Clock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAppointmentStore } from "./_store/appointment-store";
import { AppointmentCard } from "./_components/appointment-card";
import { AppointmentForm } from "./_components/appointment-form";
import { AppointmentDetail } from "./_components/appointment-detail";
import { Appointment } from "./_types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useTranslation from "@/hooks/useTranslation";

export default function AppointmentPage() {
  const { t } = useTranslation();
  const {
    appointments,
    approvedRequests,
    selectedAppointment,
    isLoading,
    isSubmitting,
    isFormOpen,
    isDetailOpen,
    fetchAppointments,
    fetchApprovedRequests,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    setFormOpen,
    setDetailOpen,
    setSelectedAppointment,
  } = useAppointmentStore();

  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchAppointments();
    fetchApprovedRequests();
  }, [fetchAppointments, fetchApprovedRequests]);

  const handleCreate = () => {
    if (approvedRequests.length === 0) {
      toast.error(t("dashboard.noApprovedRequests"));
      return;
    }
    setSelectedAppointment(null);
    setFormOpen(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDetailOpen(true);
  };

  const handleDelete = async (appointment: Appointment) => {
    try {
      await deleteAppointment(appointment.id);
      toast.success(t("dashboard.appointmentDeletedSuccessfully"));
    } catch (error: any) {
      toast.error(error.message || "Failed to delete appointment");
    }
  };

  const handleViewDetail = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDetailOpen(true);
  };

  const handleFormSubmit = async (data: {
    requestId: string;
    date: string;
    time?: string;
    notes?: string;
  }) => {
    if (selectedAppointment) {
      await updateAppointment(selectedAppointment.id, data);
    } else {
      await createAppointment(data);
    }
  };

  const handleUpdate = async (
    id: string,
    data: { date?: string; time?: string; notes?: string }
  ) => {
    try {
      await updateAppointment(id, data);
      toast.success(t("dashboard.appointmentUpdatedSuccessfully"));
    } catch (error: any) {
      toast.error(error.message || "Failed to update appointment");
    }
  };

  const handleDeleteFromDetail = async (id: string) => {
    try {
      await deleteAppointment(id);
      toast.success(t("dashboard.appointmentDeletedSuccessfully"));
    } catch (error: any) {
      toast.error(error.message || "Failed to delete appointment");
    }
  };

  // Filter appointments by status
  const filteredAppointments =
    statusFilter === "all"
      ? appointments
      : appointments.filter((apt) => apt.status === statusFilter);

  // Calculate statistics
  const stats = {
    scheduled: appointments.filter(
      (apt) => apt.status === "pending" || apt.status === "approved"
    ).length,
    completed: appointments.filter((apt) => apt.status === "completed").length,
    cancelled: appointments.filter((apt) => apt.status === "cancelled").length,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.myAppointments")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("dashboard.manageScheduledAppointments")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("dashboard.filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("dashboard.allAppointments")}</SelectItem>
              <SelectItem value="pending">{t("dashboard.pending")}</SelectItem>
              <SelectItem value="approved">{t("dashboard.approved")}</SelectItem>
              <SelectItem value="completed">{t("dashboard.completed")}</SelectItem>
              <SelectItem value="cancelled">{t("dashboard.cancelled")}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchAppointments();
              fetchApprovedRequests();
            }}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            {t("common.refresh")}
          </Button>
          <Button onClick={handleCreate} disabled={approvedRequests.length === 0}>
            <Plus className="w-4 h-4 mr-2" />
            {t("dashboard.newAppointment")}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {appointments.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {/* Scheduled Appointments Card */}
          <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 p-6 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("dashboard.scheduled")}
              </p>
              <p className="text-4xl font-bold text-blue-700 dark:text-blue-400">
                {stats.scheduled}
              </p>
            </div>
            <Clock className="absolute bottom-4 right-4 w-12 h-12 text-blue-400/40 dark:text-blue-500/30" />
          </div>

          {/* Completed Appointments Card */}
          <div className="rounded-lg border bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 p-6 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("dashboard.completed")}
              </p>
              <p className="text-4xl font-bold text-green-700 dark:text-green-400">
                {stats.completed}
              </p>
            </div>
            <CheckCircle2 className="absolute bottom-4 right-4 w-12 h-12 text-green-400/40 dark:text-green-500/30" />
          </div>

          {/* Cancelled Appointments Card */}
          <div className="rounded-lg border bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 p-6 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("dashboard.cancelled")}
              </p>
              <p className="text-4xl font-bold text-red-700 dark:text-red-400">
                {stats.cancelled}
              </p>
            </div>
            <XCircle className="absolute bottom-4 right-4 w-12 h-12 text-red-400/40 dark:text-red-500/30" />
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">{t("dashboard.loadingAppointments")}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAppointments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Calendar className="w-20 h-20 text-muted-foreground mb-6" />
          <h3 className="text-xl font-semibold mb-2">{t("dashboard.noAppointmentsFound")}</h3>
          <p className="text-muted-foreground mb-6">
            {statusFilter !== "all"
              ? t("dashboard.noAppointmentsForStatus").replace("{status}", statusFilter)
              : approvedRequests.length === 0
              ? t("dashboard.needApprovedRequestForAppointment")
              : t("dashboard.noAppointmentsCreatedYet")}
          </p>
          {approvedRequests.length > 0 && (
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              {t("dashboard.createYourFirstAppointment")}
            </Button>
          )}
        </div>
      )}

      {/* Appointments Grid */}
      {!isLoading && filteredAppointments.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onClick={handleViewDetail}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Appointment Form Dialog */}
      <AppointmentForm
        open={isFormOpen}
        onOpenChange={setFormOpen}
        appointment={selectedAppointment}
        requests={approvedRequests}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Appointment Detail Dialog */}
      <AppointmentDetail
        appointment={selectedAppointment}
        open={isDetailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={handleUpdate}
        onDelete={handleDeleteFromDetail}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

