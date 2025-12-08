"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Loader2,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Requirement {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ServiceFor {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ServiceDetail {
  id: string;
  name: string;
  description: string;
  timeToTake: string;
  officeId: string;
  office: {
    id: string;
    name: string;
    roomNumber: string;
    address: string;
    status: boolean;
  };
  requirements: Requirement[];
  serviceFors: ServiceFor[];
  assignedStaff: Array<{
    id: string;
    userId: string;
    name: string;
    email: string;
    phoneNumber: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ServiceStats {
  totalApply: number;
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  breakdown: {
    regular: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    };
    forOthers: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    };
  };
}

export default function ServiceDetailPage() {
  const params = useParams<{ domain: string; serviceId: string }>();
  const router = useRouter();
  const { serviceId } = params;

  const [service, setService] = useState<ServiceDetail | null>(null);
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServiceDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch service details and statistics in parallel
        const [serviceResponse, statsResponse] = await Promise.all([
          fetch(`/api/service/${serviceId}`, {
            cache: "no-store",
          }),
          fetch(`/api/service/${serviceId}/stats`, {
            cache: "no-store",
          }),
        ]);

        if (!serviceResponse.ok) {
          const errorData = await serviceResponse.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch service");
        }

        if (!statsResponse.ok) {
          const errorData = await statsResponse.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch statistics");
        }

        const serviceResult = await serviceResponse.json();
        const statsResult = await statsResponse.json();

        if (serviceResult.success) {
          setService(serviceResult.data);
        } else {
          throw new Error(serviceResult.error || "Failed to load service");
        }

        if (statsResult.success) {
          setStats(statsResult.data);
        } else {
          throw new Error(statsResult.error || "Failed to load statistics");
        }
      } catch (err: any) {
        console.error("Error fetching service detail:", err);
        setError(err.message || "Failed to load service details");
      } finally {
        setIsLoading(false);
      }
    };

    if (serviceId) {
      fetchServiceDetail();
    }
  }, [serviceId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 overflow-y-auto h-dvh">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="container mx-auto py-6 overflow-y-auto h-dvh">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <XCircle className="w-20 h-20 text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2">Error</h3>
          <p className="text-muted-foreground mb-6">
            {error || "Service not found"}
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 overflow-y-auto h-dvh pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{service.name}</h1>
          <p className="text-muted-foreground mt-1">{service.description}</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Apply</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApply}</div>
              <p className="text-xs text-muted-foreground">
                All requests (regular + for others)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.totalPending}
              </div>
              <p className="text-xs text-muted-foreground">
                Regular: {stats.breakdown.regular.pending} | For Others:{" "}
                {stats.breakdown.forOthers.pending}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalApproved}
              </div>
              <p className="text-xs text-muted-foreground">
                Regular: {stats.breakdown.regular.approved} | For Others:{" "}
                {stats.breakdown.forOthers.approved}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.totalRejected}
              </div>
              <p className="text-xs text-muted-foreground">
                Regular: {stats.breakdown.regular.rejected} | For Others:{" "}
                {stats.breakdown.forOthers.rejected}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            {service.requirements && service.requirements.length > 0 ? (
              <div className="space-y-4">
                {service.requirements.map((requirement) => (
                  <div key={requirement.id} className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-1 shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-medium">{requirement.name}</h4>
                        {requirement.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {requirement.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {requirement.id !==
                      service.requirements[service.requirements.length - 1]
                        .id && <Separator />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No requirements specified for this service.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Service For */}
        <Card>
          <CardHeader>
            <CardTitle>Service For</CardTitle>
          </CardHeader>
          <CardContent>
            {service.serviceFors && service.serviceFors.length > 0 ? (
              <div className="space-y-4">
                {service.serviceFors.map((serviceFor) => (
                  <div key={serviceFor.id} className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-primary mt-1 shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-medium">{serviceFor.name}</h4>
                        {serviceFor.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {serviceFor.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {serviceFor.id !==
                      service.serviceFors[service.serviceFors.length - 1]
                        .id && <Separator />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No service categories specified.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Time to Take
              </p>
              <p className="text-base">{service.timeToTake}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Office
              </p>
              <p className="text-base">{service.office.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Assigned Staff
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {service.assignedStaff && service.assignedStaff.length > 0 ? (
                  service.assignedStaff.map((staff) => (
                    <Badge key={staff.id} variant="secondary">
                      {staff.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No staff assigned
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
