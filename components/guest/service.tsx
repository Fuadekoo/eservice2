"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocale } from "@/lib/use-locale";

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
  };
}

interface OfficeWithServices {
  officeId: string;
  officeName: string;
  services: Service[];
}

export default function Service() {
  const router = useRouter();
  const { locale } = useLocale();
  const [officesWithServices, setOfficesWithServices] = useState<
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

      const response = await fetch("/api/service", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        // Group services by office
        const groupedByOffice: Record<string, OfficeWithServices> =
          result.data.reduce(
            (acc: Record<string, OfficeWithServices>, service: Service) => {
              if (!service.office || !service.office.status) {
                return acc; // Skip services from inactive offices
              }

              const officeId = service.officeId;
              const officeName = service.office.name;

              if (!acc[officeId]) {
                acc[officeId] = {
                  officeId,
                  officeName,
                  services: [],
                };
              }

              acc[officeId].services.push(service);
              return acc;
            },
            {} as Record<string, OfficeWithServices>
          );

        // Convert to array and sort by office name
        const officesArray = (
          Object.values(groupedByOffice) as OfficeWithServices[]
        ).sort((a, b) => a.officeName.localeCompare(b.officeName));

        setOfficesWithServices(officesArray);
      } else {
        setOfficesWithServices([]);
      }
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
    // Redirect to login page when Apply Now is clicked
    router.push("/signin");
  };

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h3 className="text-2xl font-bold mb-8">
          {locale === "or"
            ? "Foddaa Mootummaa"
            : locale === "am"
            ? "የመንግስት ቢሮዎች"
            : "Government Windows"}
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
          {locale === "or"
            ? "Foddaa Mootummaa"
            : locale === "am"
            ? "የመንግስት ቢሮዎች"
            : "Government Windows"}
        </h3>
        <div className="text-center text-muted-foreground">
          <p>
            {locale === "or"
              ? "Tajaajila hin argamne"
              : locale === "am"
              ? "አገልግሎት አልተገኘም"
              : "No services available"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h3 className="text-2xl font-bold mb-8">
        {locale === "or"
          ? `Foddaa Mootummaa (${officesWithServices.length})`
          : locale === "am"
          ? `የመንግስት ቢሮዎች (${officesWithServices.length})`
          : `Government Windows (${officesWithServices.length})`}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {officesWithServices.map((officeGroup) => (
          <Card
            key={officeGroup.officeId}
            onClick={() => handleCardClick(officeGroup)}
            className="p-6 cursor-pointer hover:shadow-lg transition-all duration-200 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 border-2 border-transparent hover:border-primary"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold mb-2 text-primary text-lg">
                  {officeGroup.officeName}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {officeGroup.services.length}{" "}
                  {locale === "or"
                    ? "tajaajila"
                    : locale === "am"
                    ? "ሴቪስ"
                    : "services"}
                </p>
                {/* List services below office name */}
                <div className="mt-3 space-y-1">
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
                    <p className="text-xs text-muted-foreground">
                      +{officeGroup.services.length - 3}{" "}
                      {locale === "or"
                        ? "kan biraa"
                        : locale === "am"
                        ? "ተጨማሪ"
                        : "more"}
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight size={20} className="text-primary shrink-0 ml-2" />
            </div>
          </Card>
        ))}
      </div>

      {/* Services Modal/Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto p-0">
          {/* Header with dark blue background */}
          <DialogHeader className="bg-primary text-primary-foreground p-6 flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold text-white">
              {selectedOffice?.officeName}
            </DialogTitle>
            <button
              onClick={handleCloseDialog}
              className="text-white hover:text-white/80 transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </DialogHeader>

          {/* Services List */}
          <div className="p-6 space-y-4">
            {selectedOffice?.services.map((service) => (
              <Card
                key={service.id}
                className="p-4 hover:shadow-md transition-shadow border rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 text-foreground">
                      {service.name}
                    </h3>
                    {service.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {service.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <Button
                      onClick={() => handleApplyNow(service.id)}
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      {locale === "or"
                        ? "Gaafadhu"
                        : locale === "am"
                        ? "ያመልክቱ"
                        : "Apply Now"}
                    </Button>
                    <ChevronRight size={20} className="text-muted-foreground" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
