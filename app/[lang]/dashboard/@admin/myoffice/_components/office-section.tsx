"use client";

import { useState, useEffect } from "react";
import { useMyOfficeStore } from "../_store/myoffice-store";
import { OfficeForm } from "@/app/[lang]/dashboard/@admin/office/_components/office-form";
import { OfficeFormValues } from "@/app/[lang]/dashboard/@admin/office/_schema";
import { useOfficeStore } from "@/app/[lang]/dashboard/@admin/office/_store/office-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Plus, Loader2, X, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { toast } from "sonner";

export function OfficeSection() {
  const { office, isLoadingOffice, fetchOffice, assignOffice, removeOffice } =
    useMyOfficeStore();
  const { offices, fetchOffices, createOffice } = useOfficeStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [availableOffices, setAvailableOffices] = useState<any[]>([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState("");

  useEffect(() => {
    fetchOffices({ page: 1, pageSize: 100, search: "" });
  }, [fetchOffices]);

  useEffect(() => {
    if (offices.length > 0) {
      setAvailableOffices(offices);
    }
  }, [offices]);

  const handleCreateOffice = async (data: OfficeFormValues) => {
    const success = await createOffice(data);
    if (success) {
      setIsFormOpen(false);
      // Refresh offices list
      await fetchOffices({ page: 1, pageSize: 100, search: "" });
      toast.success("Office created successfully. Please assign it to continue.");
    }
  };

  const handleAssignOffice = async () => {
    if (!selectedOfficeId) {
      toast.error("Please select an office");
      return;
    }
    const success = await assignOffice(selectedOfficeId);
    if (success) {
      setIsAssignOpen(false);
      setSelectedOfficeId("");
    }
  };

  const handleRemoveOffice = async () => {
    if (
      confirm(
        "Are you sure you want to remove this office assignment? You can assign it again later."
      )
    ) {
      await removeOffice();
    }
  };

  if (isLoadingOffice) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Office Display */}
      {office ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Office</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveOffice}
              >
                Remove Assignment
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              {office.logo ? (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <Image
                    src={office.logo}
                    alt={office.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-10 h-10 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold">{office.name}</h3>
                  <Badge variant={office.status ? "default" : "secondary"}>
                    {office.status ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    <strong>Room:</strong> {office.roomNumber}
                  </p>
                  <p>
                    <strong>Address:</strong> {office.address}
                  </p>
                  {office.phoneNumber && (
                    <p>
                      <strong>Phone:</strong> {office.phoneNumber}
                    </p>
                  )}
                  <p>
                    <strong>Subdomain:</strong> {office.subdomain}
                  </p>
                  {office.slogan && (
                    <p>
                      <strong>Slogan:</strong> {office.slogan}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Building2 className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Office Assigned
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Create a new office or assign an existing one to get started.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Office
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAssignOpen(true)}
                >
                  Assign Existing Office
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Office Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Office</DialogTitle>
            <DialogDescription>
              Create a new office that you can manage.
            </DialogDescription>
          </DialogHeader>
          <OfficeForm
            onSubmit={handleCreateOffice}
            onCancel={() => setIsFormOpen(false)}
            isLoading={false}
          />
        </DialogContent>
      </Dialog>

      {/* Assign Office Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Office</DialogTitle>
            <DialogDescription>
              Select an existing office to assign to your account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedOfficeId} onValueChange={setSelectedOfficeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an office" />
              </SelectTrigger>
              <SelectContent>
                {availableOffices.map((off) => (
                  <SelectItem key={off.id} value={off.id}>
                    {off.name} ({off.roomNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsAssignOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAssignOffice}>Assign Office</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
