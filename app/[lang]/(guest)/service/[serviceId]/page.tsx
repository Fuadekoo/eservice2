"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, Clock, FileText, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useLocale } from "@/lib/use-locale";
import useTranslation from "@/hooks/useTranslation";
import Image from "next/image";
import { Navbar } from "@/components/guest/navbar";
import { Footer } from "@/components/guest/footer";
import { useServiceDetailStore } from "./_store/service-detail-store";
import { getLogoUrl } from "@/lib/utils/logo-url";

export default function ServiceDetailPage() {
  const params = useParams<{ lang: string; serviceId: string }>();
  const router = useRouter();
  const { locale } = useLocale();
  const { t } = useTranslation();
  const { serviceId } = params;

  // Use Zustand store instead of local state
  const { service, isLoading, error, fetchServiceDetail, reset } =
    useServiceDetailStore();

  useEffect(() => {
    if (serviceId) {
      fetchServiceDetail(serviceId);
    }

    // Cleanup: reset store when component unmounts
    return () => {
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

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
              {t("guest.loadingServiceDetails")}
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
                  {t("guest.error")}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {error || t("guest.serviceNotFound")}
                </p>
                <Button onClick={() => router.back()} variant="outline">
                  {t("guest.goBack")}
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
    <div className="flex min-h-screen flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("guest.back")}
          </Button>

          {/* Service Header */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start gap-4">
                {service.office?.logo ? (
                  <div className="relative w-16 h-16 shrink-0">
                    <Image
                      src={getLogoUrl(service.office.logo) || ""}
                      alt={service.office.name}
                      fill
                      className="object-contain rounded"
                      sizes="64px"
                      onError={(e) => {
                        // Fallback to icon if image fails to load
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
                  <CardTitle className="text-2xl mb-2">
                    {service.name}
                  </CardTitle>
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
                    {t("guest.description")}
                  </h3>
                  <p className="text-muted-foreground">{service.description}</p>
                </div>

                {service.timeToTake && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                      {t("guest.timeToTake")} {service.timeToTake}
                    </span>
                  </div>
                )}

                {service.office && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span>
                        {t("guest.room")} {service.office.roomNumber}
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
                  {t("guest.applyNow")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          {service.requirements && service.requirements.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{t("guest.requirements")}</CardTitle>
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
                <CardTitle>{t("guest.thisServiceIsFor")}</CardTitle>
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
                  {t("guest.assignedStaff")}
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
