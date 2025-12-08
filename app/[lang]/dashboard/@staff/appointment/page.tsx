"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import useTranslation from "@/hooks/useTranslation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Appointment {
  id: string;
  requestId: string;
  date: string;
  time: string | null;
  status: string;
  notes: string | null;
  userId: string | null;
  staffId: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    phoneNumber: string;
  } | null;
  approveStaff: {
    id: string;
    user: {
      id: string;
      username: string;
      phoneNumber: string;
    };
  } | null;
  request: {
    id: string;
    date: string;
    statusbystaff: string;
    statusbyadmin: string;
    service: {
      id: string;
      name: string;
      description: string;
      office: {
        id: string;
        name: string;
        address: string;
        roomNumber: string;
      };
    };
    user: {
      id: string;
      username: string;
      phoneNumber: string;
    };
  };
}

export default function StaffAppointmentPage() {
  const { t } = useTranslation();
  const params = useParams<{ lang: string }>();
  const lang = params.lang || "en";
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [notes, setNotes] = useState("");

  // Pagination and filters
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAppointments();
  }, [page, pageSize, statusFilter]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });

      const response = await fetch(`/api/staff/appointment?${params}`);
      const result = await response.json();

      if (result.success) {
        setAppointments(result.data);
        setTotal(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      } else {
        toast.error(result.error || t("dashboard.failedToFetchAppointments"));
      }
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      toast.error(t("dashboard.failedToFetchAppointments"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setNotes(appointment.notes || "");
    setIsDetailOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedAppointment) return;

    setIsApproving(true);
    try {
      const response = await fetch(
        `/api/staff/appointment/${selectedAppointment.id}/approve`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: actionType,
            notes: notes || null,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success(
          result.message || t("dashboard.appointmentUpdatedSuccessfully")
        );
        setIsDetailOpen(false);
        setSelectedAppointment(null);
        setNotes("");
        fetchAppointments();
      } else {
        toast.error(result.error || t("dashboard.failedToUpdateAppointment"));
      }
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      toast.error(t("dashboard.failedToUpdateAppointment"));
    } finally {
      setIsApproving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      approved:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      completed:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      cancelled:
        "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    };

    const statusTranslations: Record<string, string> = {
      pending: t("dashboard.pending"),
      approved: t("dashboard.approved"),
      rejected: t("dashboard.rejected"),
      completed: t("dashboard.completed"),
      cancelled: t("dashboard.cancelled"),
    };

    return (
      <Badge
        className={
          statusColors[status] ||
          "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
        }
      >
        {statusTranslations[status] ||
          status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Filter appointments by search
  const filteredAppointments = appointments.filter((apt) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      apt.request.service.name.toLowerCase().includes(searchLower) ||
      apt.request.user.username.toLowerCase().includes(searchLower) ||
      apt.request.user.phoneNumber.includes(searchLower) ||
      apt.user?.username.toLowerCase().includes(searchLower) ||
      false
    );
  });

  return (
    <div className="h-dvh overflow-y-auto">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("navigation.appointment")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("dashboard.viewAndManageAppointmentsForAssignedServices")}
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={t(
                      "dashboard.searchByServiceCustomerNamePhone"
                    )}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder={t("dashboard.filterByStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("dashboard.allStatus")}
                    </SelectItem>
                    <SelectItem value="pending">
                      {t("dashboard.pending")}
                    </SelectItem>
                    <SelectItem value="approved">
                      {t("dashboard.approved")}
                    </SelectItem>
                    <SelectItem value="rejected">
                      {t("dashboard.rejected")}
                    </SelectItem>
                    <SelectItem value="completed">
                      {t("dashboard.completed")}
                    </SelectItem>
                    <SelectItem value="cancelled">
                      {t("dashboard.cancelled")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointments Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.appointments")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t("dashboard.noAppointmentsFound")}</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-hidden">
                  <div className="h-dvh overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("dashboard.service")}</TableHead>
                          <TableHead>{t("dashboard.customer")}</TableHead>
                          <TableHead>{t("dashboard.date")}</TableHead>
                          <TableHead>{t("dashboard.time")}</TableHead>
                          <TableHead>{t("common.status")}</TableHead>
                          <TableHead className="text-right">
                            {t("common.actions")}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAppointments.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell className="font-medium">
                              <div>
                                <p className="font-medium">
                                  {appointment.request.service.name}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {appointment.request.service.description}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {appointment.request.user.username}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {appointment.request.user.phoneNumber}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                {format(
                                  new Date(appointment.date),
                                  "MMM dd, yyyy"
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {appointment.time ? (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  {appointment.time}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">
                                  {t("dashboard.notSpecified")}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(appointment.status)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDetails(appointment)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 border-t pt-4">
                    <div className="text-sm text-muted-foreground">
                      {t("dashboard.showing")}{" "}
                      {Math.min((page - 1) * pageSize + 1, total)}{" "}
                      {t("dashboard.to")} {Math.min(page * pageSize, total)}{" "}
                      {t("dashboard.of")} {total} {t("dashboard.appointments")}
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => page > 1 && setPage(page - 1)}
                            className={
                              page === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1
                        ).map((pageNum) => {
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= page - 1 && pageNum <= page + 1)
                          ) {
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  onClick={() => setPage(pageNum)}
                                  isActive={pageNum === page}
                                  className="cursor-pointer"
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          } else if (
                            pageNum === page - 2 ||
                            pageNum === page + 2
                          ) {
                            return (
                              <PaginationItem key={`ellipsis-${pageNum}`}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return null;
                        })}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              page < totalPages && setPage(page + 1)
                            }
                            className={
                              page === totalPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Appointment Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("dashboard.appointmentDetails")}</DialogTitle>
              <DialogDescription>
                {t("dashboard.viewAndManageAppointmentInformation")}
              </DialogDescription>
            </DialogHeader>

            {selectedAppointment && (
              <div className="space-y-4">
                {/* Service Information */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    {t("dashboard.service")}
                  </Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">
                      {selectedAppointment.request.service.name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedAppointment.request.service.description}
                    </p>
                    <div className="mt-2 text-sm">
                      <p>
                        <span className="font-medium">
                          {t("dashboard.office")}:
                        </span>{" "}
                        {selectedAppointment.request.service.office.name}
                      </p>
                      <p>
                        <span className="font-medium">
                          {t("dashboard.room")}:
                        </span>{" "}
                        {selectedAppointment.request.service.office.roomNumber}
                      </p>
                      <p>
                        <span className="font-medium">
                          {t("dashboard.address")}:
                        </span>{" "}
                        {selectedAppointment.request.service.office.address}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    {t("dashboard.customer")}
                  </Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">
                      {selectedAppointment.request.user.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedAppointment.request.user.phoneNumber}
                    </p>
                  </div>
                </div>

                {/* Appointment Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      {t("dashboard.date")}
                    </Label>
                    <div className="p-3 bg-muted rounded-md flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {format(
                        new Date(selectedAppointment.date),
                        "MMMM dd, yyyy"
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      {t("dashboard.time")}
                    </Label>
                    <div className="p-3 bg-muted rounded-md flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      {selectedAppointment.time || t("dashboard.notSpecified")}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    {t("common.status")}
                  </Label>
                  <div>{getStatusBadge(selectedAppointment.status)}</div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-semibold">
                    {t("dashboard.notes")}
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("dashboard.addNotesAboutAppointment")}
                    rows={4}
                    disabled={isApproving}
                  />
                </div>

                {/* Action Buttons */}
                {selectedAppointment.status === "pending" && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => {
                        setActionType("approve");
                        handleApprove();
                      }}
                      disabled={isApproving}
                      className="flex-1"
                    >
                      {isApproving && actionType === "approve" ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t("dashboard.approving")}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          {t("dashboard.approve")}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setActionType("reject");
                        handleApprove();
                      }}
                      disabled={isApproving}
                      className="flex-1"
                    >
                      {isApproving && actionType === "reject" ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t("dashboard.rejecting")}
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          {t("dashboard.reject")}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDetailOpen(false);
                  setSelectedAppointment(null);
                  setNotes("");
                }}
              >
                {t("common.close")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
