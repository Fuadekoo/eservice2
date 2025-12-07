"use client";

import { useEffect, useState } from "react";
import { useMyOfficeStore } from "../_store/myoffice-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Loader2,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function AppointmentsSection() {
  const {
    office,
    appointments,
    isLoadingAppointments,
    appointmentPage,
    appointmentPageSize,
    appointmentTotal,
    appointmentTotalPages,
    appointmentSearch,
    appointmentStatusFilter,
    fetchAppointments,
    setAppointmentPage,
    setAppointmentPageSize,
    setAppointmentSearch,
    setAppointmentStatusFilter,
  } = useMyOfficeStore();
  const [localSearch, setLocalSearch] = useState("");

  useEffect(() => {
    if (office) {
      fetchAppointments();
    }
  }, [office, fetchAppointments, appointmentPage, appointmentPageSize, appointmentStatusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppointmentSearch(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, setAppointmentSearch]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-blue-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Scheduled
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="destructive">
            <Ban className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  if (!office) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please assign or create an office first to manage appointments.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Appointments</h2>
          <p className="text-muted-foreground text-sm">
            Manage appointments for {office.name}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchAppointments()}
          disabled={isLoadingAppointments}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isLoadingAppointments ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search appointments..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select
              value={appointmentStatusFilter}
              onValueChange={setAppointmentStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      {isLoadingAppointments ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Appointments Found
              </h3>
              <p className="text-sm text-muted-foreground">
                No appointments match your filters.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">
                        {appointment.request?.service?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        {appointment.request?.user?.username || "N/A"}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {appointment.request?.user?.phoneNumber || ""}
                        </span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(appointment.date), "MM/dd/yyyy")}
                      </TableCell>
                      <TableCell>
                        {appointment.time || "Not specified"}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(appointment.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {appointmentTotalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {((appointmentPage - 1) * appointmentPageSize + 1).toLocaleString()}
                -
                {Math.min(
                  appointmentPage * appointmentPageSize,
                  appointmentTotal
                ).toLocaleString()}{" "}
                of {appointmentTotal.toLocaleString()} appointments
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setAppointmentPage(Math.max(1, appointmentPage - 1))
                  }
                  disabled={appointmentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setAppointmentPage(
                      Math.min(appointmentTotalPages, appointmentPage + 1)
                    )
                  }
                  disabled={appointmentPage === appointmentTotalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
