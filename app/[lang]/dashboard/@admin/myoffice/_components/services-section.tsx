"use client";

import { useEffect, useState } from "react";
import { useMyOfficeStore } from "../_store/myoffice-store";
import { ServiceForm } from "@/app/[lang]/dashboard/@manager/services/_components/service-form";
import { ServiceFormValues } from "@/app/[lang]/dashboard/@manager/services/_schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Loader2, Building2, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ServiceAssignmentDialog } from "./service-assignment-dialog";

export function ServicesSection() {
  const {
    office,
    services,
    isLoadingServices,
    isSubmittingService,
    fetchServices,
    createService,
  } = useMyOfficeStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  useEffect(() => {
    if (office) {
      fetchServices();
    }
  }, [office, fetchServices]);

  const handleCreateService = async (data: ServiceFormValues) => {
    if (!office) {
      return;
    }
    const submitData = {
      ...data,
      officeId: office.id,
    };
    const success = await createService(submitData);
    if (success) {
      setIsFormOpen(false);
    }
  };

  if (!office) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please assign or create an office first to manage services.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Services</h2>
          <p className="text-muted-foreground text-sm">
            Manage services for {office.name}
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Service
        </Button>
      </div>

      {/* Services List */}
      {isLoadingServices ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <FileText className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Services Yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Create your first service for this office.
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Service
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      {service.office && (
                        <div className="flex items-center gap-1 mt-1">
                          <Building2 className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {service.office.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {service.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{service.timeToTake}</Badge>
                  <div className="flex gap-2">
                    {service.requirements &&
                      service.requirements.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {service.requirements.length} requirements
                        </span>
                      )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedService(service);
                      setIsAssignmentDialogOpen(true);
                    }}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Assign Staff
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Service Assignment Dialog */}
      <ServiceAssignmentDialog
        service={selectedService}
        officeId={office?.id || null}
        open={isAssignmentDialogOpen}
        onOpenChange={setIsAssignmentDialogOpen}
        onSuccess={() => {
          // Optionally refresh services or show success message
        }}
      />

      {/* Create Service Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Service</DialogTitle>
            <DialogDescription>
              Create a new service for {office?.name}
            </DialogDescription>
          </DialogHeader>
          <ServiceForm
            onSubmit={handleCreateService}
            onCancel={() => setIsFormOpen(false)}
            isLoading={isSubmittingService}
            managerOfficeId={office?.id}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
