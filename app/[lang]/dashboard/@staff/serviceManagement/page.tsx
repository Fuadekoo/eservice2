"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Briefcase,
  Loader2,
  Search,
  Building2,
  Clock,
  Users,
  FileText,
  MapPin,
  Eye,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Image from "next/image";

interface Requirement {
  id: string;
  name: string;
  description: string | null;
}

interface ServiceFor {
  id: string;
  name: string;
  description: string | null;
}

interface AssignedStaff {
  id: string;
  name: string;
  phoneNumber: string;
}

interface Office {
  id: string;
  name: string;
  address: string;
  roomNumber: string;
  logo: string | null;
  slogan: string | null;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  timeToTake: string;
  officeId: string;
  office: Office;
  requirements: Requirement[];
  serviceFors: ServiceFor[];
  assignedStaff: AssignedStaff[];
  createdAt: string;
  updatedAt: string;
}

export default function StaffServiceManagementPage() {
  const params = useParams<{ lang: string }>();
  const lang = params.lang || "en";
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Pagination and search
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    fetchServices();
  }, [page, pageSize]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // Reset to first page when searching
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (search !== undefined) {
      fetchServices();
    }
  }, [search]);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/staff/service?${params}`);
      const result = await response.json();

      if (result.success) {
        setServices(result.data);
        setTotal(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      } else {
        toast.error(result.error || "Failed to fetch services");
      }
    } catch (error: any) {
      console.error("Error fetching services:", error);
      toast.error("Failed to fetch services");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (service: Service) => {
    setSelectedService(service);
    setIsDetailOpen(true);
  };

  const getLogoUrl = (logo: string | null) => {
    if (!logo) return null;
    if (logo.startsWith("http")) return logo;
    const filename = logo.includes("/") ? logo.split("/").pop() : logo;
    return `/api/upload/logo/${filename}`;
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Service Management
          </h1>
          <p className="text-muted-foreground mt-1">
            View services assigned to you
          </p>
        </div>

        {/* Search and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search by service name, description, or office..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-11 h-11"
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{total}</p>
                  <p className="text-xs text-muted-foreground">
                    Service{total !== 1 ? "s" : ""} assigned
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : services.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No services found</p>
                <p className="text-sm">
                  {search
                    ? "Try adjusting your search criteria"
                    : "No services are currently assigned to you"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/20 overflow-hidden"
                  onClick={() => handleViewDetails(service)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {service.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {service.office.logo ? (
                            <div className="relative w-5 h-5 rounded overflow-hidden shrink-0">
                              <Image
                                src={getLogoUrl(service.office.logo) || ""}
                                alt={service.office.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <Building2 className="w-4 h-4 shrink-0" />
                          )}
                          <span className="line-clamp-1 font-medium">
                            {service.office.name}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(service);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3.75rem]">
                      {service.description || "No description available"}
                    </p>
                    <div className="space-y-2.5 pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-muted-foreground">
                          <span className="font-medium">Time:</span>{" "}
                          {service.timeToTake || "Not specified"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-muted-foreground">
                          <span className="font-medium">
                            {service.assignedStaff.length}
                          </span>{" "}
                          staff member
                          {service.assignedStaff.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {service.requirements.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-muted-foreground">
                            <span className="font-medium">
                              {service.requirements.length}
                            </span>{" "}
                            requirement
                            {service.requirements.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                      {service.serviceFors.length > 0 && (
                        <div className="flex items-start gap-2 text-sm pt-1">
                          <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mt-0.5">
                            <Users className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1">
                            <span className="text-muted-foreground block mb-1">
                              <span className="font-medium">Service For:</span>
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {service.serviceFors.slice(0, 2).map((sf) => (
                                <Badge
                                  key={sf.id}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {sf.name}
                                </Badge>
                              ))}
                              {service.serviceFors.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{service.serviceFors.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                      Showing{" "}
                      <span className="font-medium text-foreground">
                        {Math.min((page - 1) * pageSize + 1, total)}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium text-foreground">
                        {Math.min(page * pageSize, total)}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium text-foreground">
                        {total}
                      </span>{" "}
                      service{total !== 1 ? "s" : ""}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1 || isLoading}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={page === pageNum ? "default" : "outline"}
                              size="sm"
                              className="w-10"
                              onClick={() => setPage(pageNum)}
                              disabled={isLoading}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || isLoading}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Service Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Service Details</DialogTitle>
              <DialogDescription>
                Complete information about this service
              </DialogDescription>
            </DialogHeader>

            {selectedService && (
              <div className="space-y-6">
                {/* Service Name and Description */}
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">{selectedService.name}</h3>
                  {selectedService.description && (
                    <p className="text-muted-foreground">
                      {selectedService.description}
                    </p>
                  )}
                </div>

                {/* Office Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Office Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedService.office.logo && (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                        <Image
                          src={getLogoUrl(selectedService.office.logo) || ""}
                          alt={selectedService.office.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-lg">
                        {selectedService.office.name}
                      </p>
                      {selectedService.office.slogan && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedService.office.slogan}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedService.office.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span>Room: {selectedService.office.roomNumber}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Service Details */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <span className="font-semibold">Time to Take</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedService.timeToTake || "Not specified"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-muted-foreground" />
                        <span className="font-semibold">Assigned Staff</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedService.assignedStaff.length} staff member
                        {selectedService.assignedStaff.length !== 1 ? "s" : ""}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Requirements */}
                {selectedService.requirements.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Requirements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {selectedService.requirements.map((req) => (
                          <li key={req.id} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <div>
                              <p className="font-medium">{req.name}</p>
                              {req.description && (
                                <p className="text-sm text-muted-foreground">
                                  {req.description}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Service For */}
                {selectedService.serviceFors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Service For
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedService.serviceFors.map((sf) => (
                          <Badge key={sf.id} variant="secondary">
                            {sf.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Assigned Staff */}
                {selectedService.assignedStaff.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Assigned Staff Members
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedService.assignedStaff.map((staff) => (
                          <div
                            key={staff.id}
                            className="flex items-center justify-between p-3 bg-muted rounded-md"
                          >
                            <div>
                              <p className="font-medium">{staff.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {staff.phoneNumber}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Created Date */}
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Created:{" "}
                    {format(
                      new Date(selectedService.createdAt),
                      "MMMM dd, yyyy"
                    )}
                  </span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

