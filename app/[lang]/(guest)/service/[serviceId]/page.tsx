"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, Clock, FileText, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useLocale } from "@/lib/use-locale";
import Image from "next/image";
import { Navbar } from "@/components/guest/navbar";
import { Footer } from "@/components/guest/footer";

interface ServiceDetail {
  id: string;
  name: string;
  description: string;
  timeToTake: string;
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
  requirements?: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
  serviceFors?: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
  assignedStaff?: Array<{
    id: string;
    name: string;
    phoneNumber: string;
  }>;
}

export default function ServiceDetailPage() {
  const params = useParams<{ lang: string; serviceId: string }>();
  const router = useRouter();
  const { locale } = useLocale();
  const { serviceId } = params;

  const [service, setService] = useState<ServiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (serviceId) {
      fetchServiceDetail();
    }
  }, [serviceId]);

  const fetchServiceDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/service/${serviceId}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch service");
      }

      const result = await response.json();

      if (result.success) {
        setService(result.data);
      } else {
        throw new Error(result.error || "Failed to load service");
      }
    } catch (err: any) {
      console.error("Error fetching service detail:", err);
      setError(err.message || "Failed to load service details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyNow = () => {
    // Redirect to login page with callback to apply for service
    const callbackUrl = encodeURIComponent(
      `/${params.lang}/dashboard/request?serviceId=${serviceId}`
    );
    router.push(`/${params.lang}/login?callbackUrl=${callbackUrl}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground">
              {locale === "or"
                ? "Tajaajila saaxilamoo..."
                : locale === "am"
                ? "አገልግሎት በመጫን ላይ..."
                : "Loading service details..."}
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-20">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">
                  {locale === "or"
                    ? "Dogoggora"
                    : locale === "am"
                    ? "ስህተት"
                    : "Error"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {error || "Service not found"}
                </p>
                <Button onClick={() => router.back()} variant="outline">
                  {locale === "or"
                    ? "Deebi'i"
                    : locale === "am"
                    ? "ተመለስ"
                    : "Go Back"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {locale === "or"
              ? "Deebi'i"
              : locale === "am"
              ? "ተመለስ"
              : "Back"}
          </Button>

          {/* Service Header */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start gap-4">
                {service.office?.logo ? (
                  <div className="relative w-16 h-16 shrink-0">
                    <Image
                      src={`/api/filedata/${service.office.logo}`}
                      alt={service.office.name}
                      fill
                      className="object-contain rounded"
                      sizes="64px"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 shrink-0 flex items-center justify-center bg-primary/10 rounded">
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                )}
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{service.name}</CardTitle>
                  {service.office && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="w-4 h-4" />
                      <span>{service.office.name}</span>
                    </div>
                  )}
                  {service.office?.slogan && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {service.office.slogan}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">
                    {locale === "or"
                      ? "Ibsa"
                      : locale === "am"
                      ? "መግለጫ"
                      : "Description"}
                  </h3>
                  <p className="text-muted-foreground">{service.description}</p>
                </div>

                {service.timeToTake && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                      {locale === "or"
                        ? "Yeroo fudhachuu:"
                        : locale === "am"
                        ? "የሚወስድ ጊዜ:"
                        : "Time to take:"}{" "}
                      {service.timeToTake}
                    </span>
                  </div>
                )}

                {service.office && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span>
                        {locale === "or"
                          ? "Kutaa:"
                          : locale === "am"
                          ? "ክፍል:"
                          : "Room:"}{" "}
                        {service.office.roomNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="w-4 h-4" />
                      <span>{service.office.address}</span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleApplyNow}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {locale === "or"
                    ? "Gaafadhu"
                    : locale === "am"
                    ? "ያመልክቱ"
                    : "Apply Now"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          {service.requirements && service.requirements.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  {locale === "or"
                    ? "Hordoffii"
                    : locale === "am"
                    ? "መስፈርቶች"
                    : "Requirements"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {service.requirements.map((req) => (
                    <li key={req.id} className="flex items-start gap-3">
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
          {service.serviceFors && service.serviceFors.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  {locale === "or"
                    ? "Tajaajila Kanaaf"
                    : locale === "am"
                    ? "ይህ አገልግሎት ለ"
                    : "This Service is For"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {service.serviceFors.map((sf) => (
                    <li key={sf.id} className="flex items-start gap-3">
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
          {service.assignedStaff && service.assignedStaff.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {locale === "or"
                    ? "Hojjettoota Qabamoo"
                    : locale === "am"
                    ? "የተመደቡ ሰራተኞች"
                    : "Assigned Staff"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {service.assignedStaff.map((staff) => (
                    <div
                      key={staff.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <p className="font-medium">{staff.name}</p>
                      {staff.phoneNumber && (
                        <p className="text-sm text-muted-foreground">
                          {staff.phoneNumber}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

