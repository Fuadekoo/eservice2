"use client";

import { useEffect, useState } from "react";
import { useAdministrationStore } from "./_store/administration-store";
import { useAboutStore } from "./_store/about-store";
import { AdministrationForm } from "./_components/administration-form";
import { AdministrationCard } from "./_components/administration-card";
import { AboutForm } from "./_components/about-form";
import { AboutCard } from "./_components/about-card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Users, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdministrationFormValues } from "./_schema";
import { AboutFormValues } from "./_schema";
import { Administration } from "./_types";
import { About } from "./_types";
import useTranslation from "@/hooks/useTranslation";

export default function AboutPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"administrators" | "about">(
    "administrators"
  );

  // Administration store
  const {
    administrators,
    isLoading: isLoadingAdmin,
    isSubmitting: isSubmittingAdmin,
    isFormOpen: isFormOpenAdmin,
    isDeleteDialogOpen: isDeleteDialogOpenAdmin,
    selectedAdministration,
    fetchAdministrators,
    createAdministration,
    updateAdministration,
    deleteAdministration,
    setFormOpen: setFormOpenAdmin,
    setDeleteDialogOpen: setDeleteDialogOpenAdmin,
    setSelectedAdministration,
  } = useAdministrationStore();

  // About store
  const {
    aboutSections,
    isLoading: isLoadingAbout,
    isSubmitting: isSubmittingAbout,
    isFormOpen: isFormOpenAbout,
    isDeleteDialogOpen: isDeleteDialogOpenAbout,
    selectedAbout,
    fetchAboutSections,
    createAbout,
    updateAbout,
    deleteAbout,
    setFormOpen: setFormOpenAbout,
    setDeleteDialogOpen: setDeleteDialogOpenAbout,
    setSelectedAbout,
  } = useAboutStore();

  useEffect(() => {
    fetchAdministrators();
    fetchAboutSections();
  }, [fetchAdministrators, fetchAboutSections]);

  // Administration handlers
  const handleCreateAdmin = () => {
    setSelectedAdministration(null);
    setFormOpenAdmin(true);
  };

  const handleEditAdmin = (admin: Administration) => {
    setSelectedAdministration(admin);
    setFormOpenAdmin(true);
  };

  const handleDeleteAdmin = (admin: Administration) => {
    setSelectedAdministration(admin);
    setDeleteDialogOpenAdmin(true);
  };

  const handleFormSubmitAdmin = async (data: AdministrationFormValues) => {
    const success = selectedAdministration
      ? await updateAdministration(selectedAdministration.id, data)
      : await createAdministration(data);

    if (success) {
      setFormOpenAdmin(false);
      setSelectedAdministration(null);
    }
  };

  const handleDeleteConfirmAdmin = async () => {
    if (selectedAdministration) {
      const success = await deleteAdministration(selectedAdministration.id);
      if (success) {
        setDeleteDialogOpenAdmin(false);
        setSelectedAdministration(null);
      }
    }
  };

  // About handlers
  const handleCreateAbout = () => {
    setSelectedAbout(null);
    setFormOpenAbout(true);
  };

  const handleEditAbout = (about: About) => {
    setSelectedAbout(about);
    setFormOpenAbout(true);
  };

  const handleDeleteAbout = (about: About) => {
    setSelectedAbout(about);
    setDeleteDialogOpenAbout(true);
  };

  const handleFormSubmitAbout = async (data: AboutFormValues) => {
    const success = selectedAbout
      ? await updateAbout(selectedAbout.id, data)
      : await createAbout(data);

    if (success) {
      setFormOpenAbout(false);
      setSelectedAbout(null);
    }
  };

  const handleDeleteConfirmAbout = async () => {
    if (selectedAbout) {
      const success = await deleteAbout(selectedAbout.id);
      if (success) {
        setDeleteDialogOpenAbout(false);
        setSelectedAbout(null);
      }
    }
  };

  return (
    <div className="h-dvh overflow-y-auto">
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t("dashboard.aboutPageManagement")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("dashboard.manageAdministratorsAndAbout")}
          </p>
        </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "administrators" | "about")
        }
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="administrators">
            <Users className="w-4 h-4 mr-2" />
            {t("dashboard.administrators")}
          </TabsTrigger>
          <TabsTrigger value="about">
            <Info className="w-4 h-4 mr-2" />
            {t("dashboard.aboutContent")}
          </TabsTrigger>
        </TabsList>

        {/* Administrators Tab */}
        <TabsContent value="administrators" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{t("dashboard.administrators")}</h2>
            <Button onClick={handleCreateAdmin}>
              <Plus className="w-4 h-4 mr-2" />
              {t("dashboard.addAdministrator")}
            </Button>
          </div>

          {isLoadingAdmin ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : administrators.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {t("dashboard.noAdministratorsFound")}
              </p>
              <Button onClick={handleCreateAdmin}>
                <Plus className="w-4 h-4 mr-2" />
                {t("dashboard.addYourFirstAdministrator")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {administrators.map((admin) => (
                <AdministrationCard
                  key={admin.id}
                  administration={admin}
                  onEdit={handleEditAdmin}
                  onDelete={handleDeleteAdmin}
                />
              ))}
            </div>
          )}

          {/* Administration Form Dialog */}
          <Dialog open={isFormOpenAdmin} onOpenChange={setFormOpenAdmin}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedAdministration
                    ? t("dashboard.editAdministrator")
                    : t("dashboard.addAdministrator")}
                </DialogTitle>
              </DialogHeader>
              <AdministrationForm
                administration={selectedAdministration}
                onSubmit={handleFormSubmitAdmin}
                onCancel={() => {
                  setFormOpenAdmin(false);
                  setSelectedAdministration(null);
                }}
                isLoading={isSubmittingAdmin}
              />
            </DialogContent>
          </Dialog>

          {/* Administration Delete Dialog */}
          <AlertDialog
            open={isDeleteDialogOpenAdmin}
            onOpenChange={setDeleteDialogOpenAdmin}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("dashboard.areYouSure")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("dashboard.deleteAdministratorConfirm").replace("{name}", selectedAdministration?.name || "")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmittingAdmin}>
                  {t("common.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirmAdmin}
                  disabled={isSubmittingAdmin}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isSubmittingAdmin ? t("dashboard.deleting") : t("common.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* About Content Tab */}
        <TabsContent value="about" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{t("dashboard.aboutContent")}</h2>
            <Button onClick={handleCreateAbout}>
              <Plus className="w-4 h-4 mr-2" />
              {t("dashboard.addAboutSection")}
            </Button>
          </div>

          {isLoadingAbout ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : aboutSections.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {t("dashboard.noAboutSectionsFound")}
              </p>
              <Button onClick={handleCreateAbout}>
                <Plus className="w-4 h-4 mr-2" />
                {t("dashboard.addYourFirstAboutSection")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aboutSections.map((about) => (
                <AboutCard
                  key={about.id}
                  about={about}
                  onEdit={handleEditAbout}
                  onDelete={handleDeleteAbout}
                />
              ))}
            </div>
          )}

          {/* About Form Dialog */}
          <Dialog open={isFormOpenAbout} onOpenChange={setFormOpenAbout}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedAbout ? t("dashboard.editAboutSection") : t("dashboard.addAboutSection")}
                </DialogTitle>
              </DialogHeader>
              <AboutForm
                about={selectedAbout}
                onSubmit={handleFormSubmitAbout}
                onCancel={() => {
                  setFormOpenAbout(false);
                  setSelectedAbout(null);
                }}
                isLoading={isSubmittingAbout}
              />
            </DialogContent>
          </Dialog>

          {/* About Delete Dialog */}
          <AlertDialog
            open={isDeleteDialogOpenAbout}
            onOpenChange={setDeleteDialogOpenAbout}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("dashboard.areYouSure")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("dashboard.deleteAboutSectionConfirm").replace("{name}", selectedAbout?.name || "")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmittingAbout}>
                  {t("common.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirmAbout}
                  disabled={isSubmittingAbout}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isSubmittingAbout ? t("dashboard.deleting") : t("common.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
