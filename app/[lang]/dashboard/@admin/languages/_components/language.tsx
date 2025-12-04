"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import {
  useLanguagesStore,
  Language,
  TranslationKey,
} from "@/app/admin/languages/_store";
import {
  Globe,
  Languages,
  Edit,
  Save,
  Search,
  AlertCircle,
  Check,
  FileJson,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

function AddTranslationKeyModal() {
  const {
    availableLanguages,
    isAddKeyDialogOpen,
    newKeyForm,
    setIsAddKeyDialogOpen,
    updateNewKeyForm,
    addNewTranslationKey,
    translations,
    resetNewKeyForm,
  } = useLanguagesStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newKeyForm.key.trim()) {
      toast.error("Please enter a translation key");
      return;
    }

    // Check if key already exists
    const keyExists = translations.some((t) => t.key === newKeyForm.key);
    if (keyExists) {
      toast.error("Translation key already exists");
      return;
    }

    try {
      setIsSubmitting(true);
      await addNewTranslationKey(newKeyForm.key, newKeyForm.translations);
      toast.success("Translation key added successfully");
      setIsAddKeyDialogOpen(false);
      resetNewKeyForm();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add translation key"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isAddKeyDialogOpen} onOpenChange={setIsAddKeyDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Translation Key
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Translation Key</DialogTitle>
          <DialogDescription>
            Add a new translation key with values for all languages
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-key">Translation Key</Label>
            <Input
              id="new-key"
              placeholder="e.g., welcome_message"
              value={newKeyForm.key}
              onChange={(e) => updateNewKeyForm("key", e.target.value)}
            />
          </div>
          <div className="space-y-4">
            <Label>Translations</Label>
            {availableLanguages.map((lang) => (
              <div key={lang.code} className="space-y-2">
                <Label htmlFor={`new-translation-${lang.code}`}>
                  {lang.name} ({lang.code})
                </Label>
                <Input
                  id={`new-translation-${lang.code}`}
                  placeholder={`Enter translation in ${lang.name}`}
                  value={newKeyForm.translations[lang.code] || ""}
                  onChange={(e) => {
                    const translations = { ...newKeyForm.translations };
                    translations[lang.code] = e.target.value;
                    updateNewKeyForm("translations", translations);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsAddKeyDialogOpen(false);
              resetNewKeyForm();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Translation Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LanguagesPage() {
  const {
    availableLanguages,
    selectedLanguage,
    translations,
    filteredTranslations,
    searchTerm,
    isAddKeyDialogOpen,
    isEditKeyDialogOpen,
    selectedTranslationKey,
    newKeyForm,
    hasUnsavedChanges,
    isLoading,
    setSelectedLanguage,
    setSearchTerm,
    setIsAddKeyDialogOpen,
    setIsEditKeyDialogOpen,
    setSelectedTranslationKey,
    updateTranslation,
    addNewTranslationKey,
    deleteTranslationKey,
    updateNewKeyForm,
    resetNewKeyForm,
    saveTranslations,
    loadTranslations,
    addLanguage,
    deleteLanguage,
  } = useLanguagesStore();

  const [isAddLanguageDialogOpen, setIsAddLanguageDialogOpen] = useState(false);
  const [isDeleteLanguageDialogOpen, setIsDeleteLanguageDialogOpen] =
    useState(false);
  const [languageToDelete, setLanguageToDelete] = useState<string | null>(null);
  const [newLanguage, setNewLanguage] = useState<Language>({
    code: "",
    name: "",
    nativeName: "",
  });
  const [editingTranslation, setEditingTranslation] = useState<
    Record<string, string>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteKeyDialogOpen, setDeleteKeyDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);

  // Load translations on component mount
  useEffect(() => {
    loadTranslations();
  }, [loadTranslations]);

  // Handle adding new language
  const handleAddLanguage = async () => {
    if (!newLanguage.code || !newLanguage.name || !newLanguage.nativeName) {
      toast.error("Please fill in all language fields");
      return;
    }

    try {
      await addLanguage(newLanguage);
      toast.success("Language added successfully");
      setIsAddLanguageDialogOpen(false);
      setNewLanguage({ code: "", name: "", nativeName: "" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add language"
      );
    }
  };

  // Handle deleting language
  const handleDeleteLanguage = async () => {
    if (!languageToDelete) return;

    try {
      await deleteLanguage(languageToDelete);
      toast.success("Language deleted successfully");
      setIsDeleteLanguageDialogOpen(false);
      setLanguageToDelete(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete language"
      );
    }
  };

  // Handle saving translations
  const handleSaveTranslations = async () => {
    try {
      setIsSaving(true);
      await saveTranslations();
      toast.success("Translations saved successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save translations"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle editing translation
  const handleEditTranslation = (translation: TranslationKey) => {
    setSelectedTranslationKey(translation);
    setEditingTranslation({ ...translation.translations });
    setIsEditKeyDialogOpen(true);
  };

  // Handle saving edited translation
  const handleSaveEditedTranslation = async () => {
    if (!selectedTranslationKey) return;

    try {
      // Update all language translations
      for (const [langCode, value] of Object.entries(editingTranslation)) {
        await updateTranslation(selectedTranslationKey.key, langCode, value);
      }
      setIsEditKeyDialogOpen(false);
      setSelectedTranslationKey(null);
      setEditingTranslation({});
      toast.success("Translation updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update translation"
      );
    }
  };

  // Handle deleting translation key
  const handleDeleteTranslationKey = (key: string) => {
    setKeyToDelete(key);
    setDeleteKeyDialogOpen(true);
  };

  const handleDeleteKeyConfirm = async () => {
    if (!keyToDelete) return;

    try {
      setIsDeleting(true);
      await deleteTranslationKey(keyToDelete);
      toast.success("Translation key deleted successfully");
      setDeleteKeyDialogOpen(false);
      setKeyToDelete(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete translation key"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate statistics
  const totalKeys = translations.length;
  const completeTranslations = translations.filter((t) =>
    availableLanguages.every((lang) => t.translations[lang.code])
  ).length;
  const incompleteTranslations = totalKeys - completeTranslations;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Language Management
          </h2>
          <p className="text-muted-foreground">
            Manage languages and translations dynamically
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setIsAddLanguageDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Language
          </Button>
          <AddTranslationKeyModal />
          {hasUnsavedChanges && (
            <Button onClick={handleSaveTranslations} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Languages</p>
                <p className="text-2xl font-bold">
                  {availableLanguages.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileJson className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Translation Keys</p>
                <p className="text-2xl font-bold">{totalKeys}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Complete</p>
                <p className="text-2xl font-bold">{completeTranslations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Incomplete</p>
                <p className="text-2xl font-bold">{incompleteTranslations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Languages */}
      <Card>
        <CardHeader>
          <CardTitle>Available Languages</CardTitle>
          <CardDescription>Languages supported by the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {availableLanguages.map((lang) => (
              <div
                key={lang.code}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{lang.nativeName}</p>
                    <p className="text-sm text-muted-foreground">
                      {lang.name} • Code: {lang.code}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedLanguage === lang.code && (
                    <Badge className="bg-primary">Current</Badge>
                  )}
                  {lang.code !== "en" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLanguageToDelete(lang.code);
                        setIsDeleteLanguageDialogOpen(true);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Translations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Translation Keys</CardTitle>
              <CardDescription>
                Manage all translation keys and their values
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search translations by key or value..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-[600px] rounded-md border">
            <div className="p-4">
              <div className="space-y-2">
                {filteredTranslations.map((translation, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {translation.key}
                        </code>
                        {availableLanguages.some(
                          (lang) => !translation.translations[lang.code]
                        ) && (
                          <Badge variant="destructive" className="text-xs">
                            Incomplete
                          </Badge>
                        )}
                      </div>
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                        {availableLanguages.map((lang) => (
                          <div key={lang.code} className="space-y-1">
                            <p className="text-xs text-muted-foreground font-semibold">
                              {lang.name} ({lang.code})
                            </p>
                            <p className="text-sm">
                              {translation.translations[lang.code] || (
                                <span className="text-muted-foreground italic">
                                  Not translated
                                </span>
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTranslation(translation)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDeleteTranslationKey(translation.key)
                        }
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add Language Dialog */}
      <Dialog
        open={isAddLanguageDialogOpen}
        onOpenChange={setIsAddLanguageDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Language</DialogTitle>
            <DialogDescription>
              Add a new language to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lang-code">Language Code</Label>
              <Input
                id="lang-code"
                placeholder="e.g., fr, de, es"
                value={newLanguage.code}
                onChange={(e) =>
                  setNewLanguage({ ...newLanguage, code: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lang-name">Language Name</Label>
              <Input
                id="lang-name"
                placeholder="e.g., French, German, Spanish"
                value={newLanguage.name}
                onChange={(e) =>
                  setNewLanguage({ ...newLanguage, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lang-native">Native Name</Label>
              <Input
                id="lang-native"
                placeholder="e.g., Français, Deutsch, Español"
                value={newLanguage.nativeName}
                onChange={(e) =>
                  setNewLanguage({
                    ...newLanguage,
                    nativeName: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddLanguageDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddLanguage}>Add Language</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Translation Dialog */}
      <Dialog open={isEditKeyDialogOpen} onOpenChange={setIsEditKeyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Translation</DialogTitle>
            <DialogDescription>
              Update translations for:{" "}
              <code className="font-mono text-primary">
                {selectedTranslationKey?.key}
              </code>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {availableLanguages.map((lang) => (
              <div key={lang.code} className="space-y-2">
                <Label htmlFor={`edit-translation-${lang.code}`}>
                  {lang.name} ({lang.code})
                </Label>
                <Textarea
                  id={`edit-translation-${lang.code}`}
                  placeholder={`Enter translation in ${lang.name}`}
                  value={editingTranslation[lang.code] || ""}
                  onChange={(e) => {
                    setEditingTranslation({
                      ...editingTranslation,
                      [lang.code]: e.target.value,
                    });
                  }}
                  rows={2}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditKeyDialogOpen(false);
                setSelectedTranslationKey(null);
                setEditingTranslation({});
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEditedTranslation}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Language Confirmation */}
      <AlertDialog
        open={isDeleteLanguageDialogOpen}
        onOpenChange={setIsDeleteLanguageDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Language</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this language? This action cannot
              be undone. All translations for this language will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setLanguageToDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLanguage}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Translation Key Confirmation */}
      <AlertDialog
        open={deleteKeyDialogOpen}
        onOpenChange={setDeleteKeyDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Translation Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the translation key "{keyToDelete}
              "? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setKeyToDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteKeyConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
