"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, X, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
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

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch both services and offices in parallel
      const [servicesResponse, officesResponse] = await Promise.all([
        fetch("/api/service", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }),
        fetch("/api/office?limit=1000", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }),
      ]);

      // Check if responses are JSON before parsing
      const servicesContentType = servicesResponse.headers.get("content-type");
      const officesContentType = officesResponse.headers.get("content-type");

      if (
        !servicesContentType ||
        !servicesContentType.includes("application/json")
      ) {
        const text = await servicesResponse.text();
        throw new Error(
          `Server returned non-JSON response: ${servicesResponse.status} ${servicesResponse.statusText}`
        );
      }

      if (
        !officesContentType ||
        !officesContentType.includes("application/json")
      ) {
        const text = await officesResponse.text();
        throw new Error(
          `Server returned non-JSON response: ${officesResponse.status} ${officesResponse.statusText}`
        );
      }

      const servicesResult = await servicesResponse.json();
      const officesResult = await officesResponse.json();

      if (!servicesResponse.ok) {
        throw new Error(
          servicesResult.error ||
            `Failed to fetch services: ${servicesResponse.status} ${servicesResponse.statusText}`
        );
      }

      if (!officesResponse.ok) {
        throw new Error(
          officesResult.error ||
            `Failed to fetch offices: ${officesResponse.status} ${officesResponse.statusText}`
        );
      }

      // Get all active offices
      const allActiveOffices =
        officesResult.success && Array.isArray(officesResult.data)
          ? officesResult.data.filter((office: any) => office.status === true)
          : [];

      // Group services by office
      const groupedByOffice: Record<string, OfficeWithServices> = {};

      if (servicesResult.success && Array.isArray(servicesResult.data)) {
        servicesResult.data.forEach((service: Service) => {
          if (!service.office || !service.office.status) {
            return; // Skip services from inactive offices
          }

          const officeId = service.officeId;
          const officeName = service.office.name;
          const officeLogo = service.office.logo;
          const officeSlogan = service.office.slogan;

          if (!groupedByOffice[officeId]) {
            groupedByOffice[officeId] = {
              officeId,
              officeName,
              officeLogo,
              officeSlogan,
              services: [],
            };
          }

          groupedByOffice[officeId].services.push(service);
        });
      }

      // Add offices with no services
      allActiveOffices.forEach((office: any) => {
        if (!groupedByOffice[office.id]) {
          groupedByOffice[office.id] = {
            officeId: office.id,
            officeName: office.name,
            officeLogo: office.logo,
            officeSlogan: office.slogan,
            services: [],
          };
        }
      });

      // Convert to array and sort by office name
      const officesArray = (
        Object.values(groupedByOffice) as OfficeWithServices[]
      ).sort((a, b) => a.officeName.localeCompare(b.officeName));

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
  };

  const handleApplyNow = (serviceId: string) => {
    // Redirect to login page with callback to apply for service
    const callbackUrl = encodeURIComponent(
      `/${locale}/dashboard/request?serviceId=${serviceId}`
    );
    router.push(`/${locale}/login?callbackUrl=${callbackUrl}`);
  };

  const handleServiceClick = (serviceId: string) => {
    // Redirect to service detail page
    router.push(`/${locale}/service/${serviceId}`);
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
                  {t("guest.noServicesAvailable") || "No Services Available"}
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
        </DialogContent>
      </Dialog>
    </section>
  );
}
