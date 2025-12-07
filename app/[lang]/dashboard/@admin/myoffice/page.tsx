"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Loader2, AlertCircle } from "lucide-react";
import { useMyOfficeStore } from "./_store/myoffice-store";
import { OfficeSection } from "./_components/office-section";
import { ServicesSection } from "./_components/services-section";
import { RequestsSection } from "./_components/requests-section";
import { AppointmentsSection } from "./_components/appointments-section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function MyOfficePage() {
  const { office, isLoadingOffice, fetchOffice } = useMyOfficeStore();
  const [activeTab, setActiveTab] = useState("office");

  useEffect(() => {
    fetchOffice();
  }, [fetchOffice]);

  if (isLoadingOffice) {
    return (
      <div className="w-full h-full overflow-y-auto py-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Office</h1>
            <p className="text-muted-foreground mt-1">
              Manage your office, services, requests, and appointments
            </p>
          </div>
        </div>

        {/* Office Status Alert */}
        {!office && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You haven't assigned an office yet. Please create or select an
              office to get started.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="office">
              <Building2 className="w-4 h-4 mr-2" />
              Office
            </TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
          </TabsList>

          <TabsContent value="office" className="mt-6">
            <OfficeSection />
          </TabsContent>

          <TabsContent value="services" className="mt-6">
            <ServicesSection />
          </TabsContent>

          <TabsContent value="requests" className="mt-6">
            <RequestsSection />
          </TabsContent>

          <TabsContent value="appointments" className="mt-6">
            <AppointmentsSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
