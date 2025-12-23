"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  X,
  Building2,
  ArrowLeft,
  Clock,
  FileText,
  Users,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocale } from "@/lib/use-locale";
import useTranslation from "@/hooks/useTranslation";
import Image from "next/image";
import { getLogoUrl } from "@/lib/utils/logo-url";
import { useServiceDetailStore } from "@/app/[lang]/(guest)/service/[serviceId]/_store/service-detail-store";

interface Service {
  id: string;
  name: string;
  description: string;
  officeId: string;
  office?: {
    id: string;
    name: string;
    roomNumber: string;
    address: string;
    status: boolean;
    logo?: string | null;
    slogan?: string | null;
  };
}

interface OfficeWithServices {
  officeId: string;
  officeName: string;
  officeLogo?: string | null;
  officeSlogan?: string | null;
  services: Service[];
}

interface ServiceProps {
  searchQuery?: string;
}

export default function Service({ searchQuery = "" }: ServiceProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const { t } = useTranslation();
  const [officesWithServices, setOfficesWithServices] = useState<
    OfficeWithServices[]
  >([]);
  const [allOfficesWithServices, setAllOfficesWithServices] = useState<
    OfficeWithServices[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOffice, setSelectedOffice] =
    useState<OfficeWithServices | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showServiceDetail, setShowServiceDetail] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null
  );

  // Use service detail store
  const {
    service: serviceDetail,
    isLoading: isLoadingDetail,
    error: serviceDetailError,
    fetchServiceDetail,
    reset: resetServiceDetail,
  } = useServiceDetailStore();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch offices with services from a single optimized API endpoint
      const response = await fetch("/api/guest/data", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(
          `Server returned non-JSON response: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            `Failed to fetch guest data: ${response.status} ${response.statusText}`
        );
      }

      if (!result.success || !Array.isArray(result.data)) {
        throw new Error("Invalid response format from server");
      }

      // The API already returns offices with services grouped
      // Just need to map to our interface format
      const officesArray: OfficeWithServices[] = result.data.map(
        (item: any) => ({
          officeId: item.officeId,
          officeName: item.officeName,
          officeLogo: item.officeLogo,
          officeSlogan: item.officeSlogan,
          services: (item.services || []).map((service: any) => ({
            id: service.id,
            name: service.name,
            description: service.description,
            officeId: service.officeId,
            office: {
              id: item.officeId,
              name: item.officeName,
              roomNumber: item.officeRoomNumber,
              address: item.officeAddress,
              status: true,
              logo: item.officeLogo,
              slogan: item.officeSlogan,
            },
          })),
        })
      );

      console.log(
        `✅ Loaded ${officesArray.length} offices with ${
          result.meta?.totalServices || 0
        } total services`
      );

      setAllOfficesWithServices(officesArray);
      setOfficesWithServices(officesArray);
    } catch (err: any) {
      console.error("Error fetching services:", err);
      setError(err.message || "Failed to load services");
      setOfficesWithServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (officeGroup: OfficeWithServices) => {
    setSelectedOffice(officeGroup);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedOffice(null);
    setShowServiceDetail(false);
    setSelectedServiceId(null);
    resetServiceDetail();
  };

  const handleBackToServices = () => {
    setShowServiceDetail(false);
    setSelectedServiceId(null);
    resetServiceDetail();
  };

  const handleApplyNow = async (serviceId: string) => {
    // Fetch service detail and show it in dialog
    setSelectedServiceId(serviceId);
    setShowServiceDetail(true);
    await fetchServiceDetail(serviceId);
  };

  const handleApplyFromDetail = () => {
    if (!selectedServiceId) return;
    // Redirect to login page with callback to apply for service
    const callbackUrl = encodeURIComponent(
      `/${locale}/dashboard/request?serviceId=${selectedServiceId}`
    );
    router.push(`/${locale}/login?callbackUrl=${callbackUrl}`);
  };

  const handleServiceClick = (serviceId: string) => {
    // Fetch service detail and show it in dialog
    setSelectedServiceId(serviceId);
    setShowServiceDetail(true);
    fetchServiceDetail(serviceId);
  };

  // Filter offices based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setOfficesWithServices(allOfficesWithServices);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = allOfficesWithServices.filter((office) => {
      const officeName = office.officeName.toLowerCase();
      const officeSlogan = (office.officeSlogan || "").toLowerCase();
      return officeName.includes(query) || officeSlogan.includes(query);
    });

    setOfficesWithServices(filtered);
  }, [searchQuery, allOfficesWithServices]);

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h3 className="text-2xl font-bold mb-8">
          {t("guest.governmentWindows")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center text-muted-foreground">
          <p>{error}</p>
        </div>
      </section>
    );
  }

  if (officesWithServices.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h3 className="text-2xl font-bold mb-8">
          {t("guest.governmentWindows")}
        </h3>
        <div className="text-center text-muted-foreground">
          <p>{t("guest.noServicesAvailable")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h3 className="text-2xl font-bold mb-8">
        {t("guest.governmentOffice")} ({officesWithServices.length})
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {officesWithServices.map((officeGroup) => (
          <Card
            key={officeGroup.officeId}
            onClick={() => handleCardClick(officeGroup)}
            className="p-6 cursor-pointer hover:shadow-lg transition-all duration-200 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 border-2 border-transparent hover:border-primary overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3 h-full">
              <div className="flex-1 min-w-0 overflow-hidden">
                {/* Logo or Icon */}
                <div className="flex items-center gap-3 mb-3">
                  {officeGroup.officeLogo ? (
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
                      <Image
                        src={getLogoUrl(officeGroup.officeLogo) || ""}
                        alt={officeGroup.officeName}
                        fill
                        className="object-contain rounded"
                        sizes="96px"
                        unoptimized
                        onError={(e) => {
                          // Fallback to icon if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center bg-primary/10 rounded">
                      <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-primary text-base sm:text-lg break-words hyphens-auto">
                      {officeGroup.officeName}
                    </h4>
                    {officeGroup.officeSlogan && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {officeGroup.officeSlogan}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {officeGroup.services.length} {t("guest.services")}
                </p>
                {/* List services below office name */}
                <div className="mt-3 space-y-1 overflow-hidden">
                  {officeGroup.services.slice(0, 3).map((service) => (
                    <p
                      key={service.id}
                      className="text-xs text-muted-foreground truncate"
                      title={service.name}
                    >
                      • {service.name}
                    </p>
                  ))}
                  {officeGroup.services.length > 3 && (
                    <p className="text-xs text-muted-foreground truncate">
                      +{officeGroup.services.length - 3} {t("guest.more")}
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight size={20} className="text-primary shrink-0" />
            </div>
          </Card>
        ))}
      </div>

      {/* Services Modal/Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col p-0 w-[95vw] sm:w-full">
          {!showServiceDetail ? (
            <>
              {/* Header with dark blue background */}
              <DialogHeader className="bg-primary text-primary-foreground p-4 sm:p-6 shrink-0">
                <div className="flex flex-row items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                    {selectedOffice?.officeLogo ? (
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
                        <Image
                          src={getLogoUrl(selectedOffice.officeLogo) || ""}
                          alt={selectedOffice.officeName}
                          fill
                          className="object-contain rounded bg-white/10"
                          sizes="96px"
                          unoptimized
                          onError={(e) => {
                            // Fallback to icon if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center bg-white/10 rounded">
                        <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                      </div>
                    )}
                    <DialogTitle className="text-lg sm:text-xl font-bold text-white break-words hyphens-auto flex-1">
                      {selectedOffice?.officeName}
                    </DialogTitle>
                  </div>
                  <button
                    onClick={handleCloseDialog}
                    className="text-white hover:text-white/80 transition-colors shrink-0"
                    aria-label="Close"
                  >
                    <X size={20} className="sm:w-6 sm:h-6" />
                  </button>
                </div>
                {selectedOffice?.officeSlogan && (
                  <p className="text-xs sm:text-sm text-white/90 mt-2 line-clamp-2">
                    {selectedOffice.officeSlogan}
                  </p>
                )}
              </DialogHeader>

              {/* Services List */}
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
                {selectedOffice && selectedOffice.services.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Building2 className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">
                      {t("guest.noServicesAvailable") ||
                        "No Services Available"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t("guest.noServicesForThisOffice") ||
                        "This office currently has no services available."}
                    </p>
                  </div>
                ) : (
                  selectedOffice?.services.map((service) => (
                    <Card
                      key={service.id}
                      className="p-3 sm:p-4 hover:shadow-md transition-shadow border rounded-lg cursor-pointer"
                      onClick={() => handleServiceClick(service.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base sm:text-lg mb-1 text-foreground break-words hyphens-auto">
                            {service.name}
                          </h3>
                          {service.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                              {service.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 sm:ml-4 shrink-0">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyNow(service.id);
                            }}
                            className="bg-primary hover:bg-primary/90 text-white text-sm sm:text-base px-3 sm:px-4 py-2"
                            size="sm"
                          >
                            {t("guest.applyNow")}
                          </Button>
                          <ChevronRight
                            size={18}
                            className="text-muted-foreground hidden sm:block"
                          />
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              {/* Service Detail View */}
              <DialogHeader className="bg-primary text-primary-foreground p-4 sm:p-6 shrink-0">
                <div className="flex flex-row items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleBackToServices}
                      className="text-white hover:bg-white/20 shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <DialogTitle className="text-lg sm:text-xl font-bold text-white break-words hyphens-auto flex-1">
                      {isLoadingDetail
                        ? t("guest.loadingServiceDetails")
                        : serviceDetail?.name || ""}
                    </DialogTitle>
                  </div>
                  <button
                    onClick={handleCloseDialog}
                    className="text-white hover:text-white/80 transition-colors shrink-0"
                    aria-label="Close"
                  >
                    <X size={20} className="sm:w-6 sm:h-6" />
                  </button>
                </div>
              </DialogHeader>

              {/* Service Detail Content */}
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                {isLoadingDetail ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">
                      {t("guest.loadingServiceDetails")}
                    </p>
                  </div>
                ) : serviceDetailError || !serviceDetail ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Building2 className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">
                      {t("guest.error")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {serviceDetailError || t("guest.serviceNotFound")}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Service Header */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          {serviceDetail.office?.logo ? (
                            <div className="relative w-16 h-16 shrink-0">
                              <Image
                                src={
                                  getLogoUrl(serviceDetail.office.logo) || ""
                                }
                                alt={serviceDetail.office.name}
                                fill
                                className="object-contain rounded"
                                sizes="64px"
                                unoptimized
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 shrink-0 flex items-center justify-center bg-primary/10 rounded">
                              <Building2 className="w-8 h-8 text-primary" />
                            </div>
                          )}
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2">
                              {serviceDetail.name}
                            </CardTitle>
                            {serviceDetail.office && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Building2 className="w-4 h-4" />
                                <span>{serviceDetail.office.name}</span>
                              </div>
                            )}
                            {serviceDetail.office?.slogan && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {serviceDetail.office.slogan}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold mb-2">
                              {t("guest.description")}
                            </h3>
                            <p className="text-muted-foreground">
                              {serviceDetail.description}
                            </p>
                          </div>

                          {serviceDetail.timeToTake && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>
                                {t("guest.timeToTake")}{" "}
                                {serviceDetail.timeToTake}
                              </span>
                            </div>
                          )}

                          {serviceDetail.office && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <FileText className="w-4 h-4" />
                                <span>
                                  {t("guest.room")}{" "}
                                  {serviceDetail.office.roomNumber}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Building2 className="w-4 h-4" />
                                <span>{serviceDetail.office.address}</span>
                              </div>
                            </div>
                          )}

                          <Button
                            onClick={handleApplyFromDetail}
                            size="lg"
                            className="w-full sm:w-auto"
                          >
                            {t("guest.applyNow")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Requirements */}
                    {serviceDetail.requirements &&
                      serviceDetail.requirements.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle>{t("guest.requirements")}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-3">
                              {serviceDetail.requirements.map((req) => (
                                <li
                                  key={req.id}
                                  className="flex items-start gap-3"
                                >
                                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
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
                    {serviceDetail.serviceFors &&
                      serviceDetail.serviceFors.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle>{t("guest.thisServiceIsFor")}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-3">
                              {serviceDetail.serviceFors.map((sf) => (
                                <li
                                  key={sf.id}
                                  className="flex items-start gap-3"
                                >
                                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                                  <div>
                                    <p className="font-medium">{sf.name}</p>
                                    {sf.description && (
                                      <p className="text-sm text-muted-foreground">
                                        {sf.description}
                                      </p>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                    {/* Assigned Staff */}
                    {serviceDetail.assignedStaff &&
                      serviceDetail.assignedStaff.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Users className="w-5 h-5" />
                              {t("guest.assignedStaff")}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {serviceDetail.assignedStaff.map((staff) => (
                                <div
                                  key={staff.id}
                                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  <p className="font-medium">{staff.name}</p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
