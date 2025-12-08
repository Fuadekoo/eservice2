"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileText,
  Calendar,
  Briefcase,
  Loader2,
  ArrowRight,
  Settings,
  ClipboardList,
  Building2,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useTranslation from "@/hooks/useTranslation";

interface DashboardStats {
  totalStaff: number;
  pendingRequests: number;
  scheduledAppointments: number;
  totalServices: number;
  recentRequests: {
    id: string;
    applicant: string;
    service: string;
    date: string;
    status: string;
  }[];
  office: {
    id: string;
    name: string;
    logo: string | null;
    slogan: string | null;
  };
  username: string;
  role: string;
}

export default function ManagerOverviewPage() {
  const { t } = useTranslation();
  const params = useParams<{ lang: string }>();
  const lang = params.lang || "en";
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/manager/overview", {
          cache: "no-store",
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setStats(result.data);
          }
        }
      } catch (error) {
        console.error("Error fetching manager overview:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      Pending:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      Approved:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      Processing:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      Rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };

    return (
      <Badge
        className={
          statusColors[status] ||
          "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
        }
      >
        {status === "Pending"
          ? t("dashboard.pending")
          : status === "Approved"
          ? t("dashboard.approved")
          : status === "Processing"
          ? t("dashboard.processing")
          : status === "Rejected"
          ? t("dashboard.rejected")
          : status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getLogoUrl = (logo: string | null) => {
    if (!logo) return null;
    if (logo.startsWith("http")) return logo;
    const filename = logo.includes("/") ? logo.split("/").pop() : logo;
    return `/api/upload/logo/${filename}`;
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto py-6 space-y-6">
        {/* Office Logo and Slogan */}
        {stats?.office && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                {stats.office.logo ? (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                    <Image
                      src={getLogoUrl(stats.office.logo) || ""}
                      alt={stats.office.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Building2 className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{stats.office.name}</h2>
                  {stats.office.slogan && (
                    <p className="text-muted-foreground mt-1">
                      {stats.office.slogan}
                    </p>
                  )}
                  {stats.role && (
                    <p className="text-sm text-muted-foreground mt-2 font-medium">
                      {t("dashboard.youAreTheRoleOfOffice")
                        .replace("{role}", stats.role)
                        .replace("{office}", stats.office.name)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {stats?.username
              ? t("dashboard.welcomeBackUser").replace(
                  "{username}",
                  stats.username
                )
              : t("dashboard.welcomeBack")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("dashboard.officeOverviewAndManagement")}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Staff */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t("dashboard.totalStaff")}
                  </p>
                  <p className="text-3xl font-bold">
                    {stats?.totalStaff?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Requests */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t("dashboard.pendingRequests")}
                  </p>
                  <p className="text-3xl font-bold">
                    {stats?.pendingRequests || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scheduled Appointments */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t("dashboard.scheduledAppointments")}
                  </p>
                  <p className="text-3xl font-bold">
                    {stats?.scheduledAppointments || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Services */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t("dashboard.totalServices")}
                  </p>
                  <p className="text-3xl font-bold">
                    {stats?.totalServices || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Requests */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.recentRequests")}</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.recentRequests && stats.recentRequests.length > 0 ? (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("dashboard.applicant")}</TableHead>
                            <TableHead>{t("dashboard.service")}</TableHead>
                            <TableHead>{t("common.date")}</TableHead>
                            <TableHead>{t("common.status")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.recentRequests.map((req) => (
                            <TableRow key={req.id}>
                              <TableCell className="font-medium">
                                {req.applicant}
                              </TableCell>
                              <TableCell>{req.service}</TableCell>
                              <TableCell>
                                {format(new Date(req.date), "yyyy-MM-dd")}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(req.status)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="mt-4">
                      <Link href={`/${lang}/dashboard/requestmanagement`}>
                        <Button className="w-full" variant="default">
                          {t("dashboard.viewAllRequests")}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{t("dashboard.noRequestsYet")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.quickActions")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/${lang}/dashboard/requestmanagement`}>
                  <Button
                    className="w-full justify-start"
                    variant="default"
                    size="lg"
                  >
                    <ClipboardList className="w-4 h-4 mr-2" />
                    {t("dashboard.reviewRequests")}
                  </Button>
                </Link>
                <Link href={`/${lang}/dashboard/services`}>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    size="lg"
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    {t("dashboard.manageServices")}
                  </Button>
                </Link>
                <Link href={`/${lang}/dashboard/staff`}>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    size="lg"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {t("dashboard.manageStaff")}
                  </Button>
                </Link>
                <Link href={`/${lang}/dashboard/report`}>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    size="lg"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {t("dashboard.viewReports")}
                  </Button>
                </Link>
                <Link href={`/${lang}/dashboard/configuration/office`}>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    size="lg"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {t("dashboard.officeSettings")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
