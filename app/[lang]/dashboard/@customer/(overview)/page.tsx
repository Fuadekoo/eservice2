"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  Plus,
  Download,
  ArrowRight,
  Loader2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { useCustomerRequestStore } from "../request/_store/request-store";
import { useAppointmentStore } from "../appointment/_store/appointment-store";
import { calculateOverallStatus } from "@/lib/request-status";
import { RequestStatus } from "../request/_types";
import { Appointment } from "../appointment/_types";
import Link from "next/link";

export default function CustomerOverviewPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params.lang || "en";
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const {
    requests,
    isLoading: isLoadingRequests,
    fetchMyRequests,
    setCurrentUserId,
  } = useCustomerRequestStore();

  const {
    appointments,
    isLoading: isLoadingAppointments,
    fetchAppointments,
  } = useAppointmentStore();

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/user/me", { cache: "no-store" });
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setUser(result.data);
            setCurrentUserId(result.data.id);
            // Fetch requests and appointments
            await fetchMyRequests(result.data.id);
            await fetchAppointments();
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUser();
  }, [fetchMyRequests, fetchAppointments, setCurrentUserId]);

  // Calculate statistics
  const stats = {
    total: requests.length,
    pending: requests.filter(
      (req) =>
        calculateOverallStatus(req.statusbystaff, req.statusbyadmin) ===
        RequestStatus.PENDING
    ).length,
    approved: requests.filter(
      (req) =>
        calculateOverallStatus(req.statusbystaff, req.statusbyadmin) ===
        RequestStatus.APPROVED
    ).length,
    appointments: appointments.filter(
      (apt) => apt.status === "pending" || apt.status === "approved"
    ).length,
  };

  // Get recent applications (last 3)
  const recentApplications = [...requests]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 3);

  // Get upcoming appointments (scheduled/pending/approved, next 3)
  const upcomingAppointments = [...appointments]
    .filter((apt) => apt.status === "pending" || apt.status === "approved")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const isLoading = isLoadingUser || isLoadingRequests || isLoadingAppointments;

  const getStatusBadge = (request: (typeof requests)[0]) => {
    const status = calculateOverallStatus(
      request.statusbystaff,
      request.statusbyadmin
    );
    switch (status) {
      case RequestStatus.APPROVED:
        return (
          <Badge variant="default" className="bg-green-600">
            Approved
          </Badge>
        );
      case RequestStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getAppointmentStatusBadge = (appointment: Appointment) => {
    switch (appointment.status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-blue-600">
            Scheduled
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="default" className="bg-green-600">
            Completed
          </Badge>
        );
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 overflow-y-auto h-full">
      {/* Welcome Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.username || "User"}!
        </h1>
        <p className="text-muted-foreground">
          Here's your service dashboard overview
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Applications */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Total Applications
                </p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Pending
                </p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.pending}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approved */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Approved
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.approved}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointments */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Appointments
                </p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.appointments}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Applications */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Applications</h2>
            </div>
            <div className="space-y-4">
              {recentApplications.length > 0 ? (
                recentApplications.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm mb-1">
                        {request.service.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {request.service.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(request.date), "MM/dd/yyyy")}
                      </p>
                    </div>
                    <div className="ml-4 shrink-0">
                      {getStatusBadge(request)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No applications yet</p>
                </div>
              )}
            </div>
            {requests.length > 3 && (
              <Button variant="default" className="w-full mt-4" asChild>
                <Link href={`/${lang}/dashboard/request`}>
                  View All Applications
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Your Appointments */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Your Appointments</h2>
            </div>
            <div className="space-y-4">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm mb-1">
                        {appointment.request.service.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(appointment.date), "MM/dd/yyyy")}
                        {appointment.time && ` at ${appointment.time}`}
                      </p>
                    </div>
                    <div className="ml-4 shrink-0">
                      {getAppointmentStatusBadge(appointment)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No upcoming appointments</p>
                </div>
              )}
            </div>
            {appointments.length > 3 && (
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href={`/${lang}/dashboard/appointment`}>
                  View All Appointments
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="default"
              className="justify-start h-auto py-3"
              asChild
            >
              <Link href={`/${lang}/dashboard/applyservice`}>
                <Plus className="w-4 h-4 mr-2" />
                Apply New Service
              </Link>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              asChild
            >
              <Link href={`/${lang}/dashboard/appointment`}>
                <Calendar className="w-4 h-4 mr-2" />
                Book Appointment
              </Link>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              asChild
            >
              <Link href={`/${lang}/dashboard/appointment`}>
                <Calendar className="w-4 h-4 mr-2" />
                My Appointments
              </Link>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              asChild
            >
              <Link href={`/${lang}/dashboard/request`}>
                <Download className="w-4 h-4 mr-2" />
                Download Documents
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
