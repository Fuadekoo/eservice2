"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User, Lock, Phone } from "lucide-react";
import { useProfileStore } from "./_store/profile-store";
import { profileUpdateSchema, passwordChangeSchema } from "./_schema";
import useTranslation from "@/hooks/useTranslation";

export default function ProfilePage() {
  const { t } = useTranslation();
  const params = useParams<{ lang: string }>();
  const lang = params.lang || "en";
  const [activeTab, setActiveTab] = useState("profile");

  const {
    profile,
    isLoading,
    isUpdating,
    isChangingPassword,
    fetchProfile,
    updateProfile,
    changeUserPassword,
  } = useProfileStore();

  // Profile form state
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Load user profile data
  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError("");

    // Validate with schema
    const validation = profileUpdateSchema.safeParse({ username });

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      setUsernameError(firstError.message);
      return;
    }

    try {
      await updateProfile({ username: validation.data.username });
    } catch (error) {
      // Error is handled in the store with toast
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});

    // Validate with schema
    const validation = passwordChangeSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!validation.success) {
      const errors: typeof passwordErrors = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as keyof typeof errors] = err.message;
        }
      });
      setPasswordErrors(errors);
      return;
    }

    try {
      await changeUserPassword({
        currentPassword: validation.data.currentPassword,
        newPassword: validation.data.newPassword,
      });
      // Reset password fields on success
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordErrors({});
    } catch (error) {
      // Error is handled in the store with toast
    }
  };

  return (
    <div className="h-dvh overflow-y-auto">
      <div className="container mx-auto py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("profile.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("profile.manageInfo")}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="profile" className="gap-2">
                <User className="w-4 h-4" />
                {t("profile.updateProfile")}
              </TabsTrigger>
              <TabsTrigger value="password" className="gap-2">
                <Lock className="w-4 h-4" />
                {t("profile.changePassword")}
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>{t("profile.updatePersonalInfo")}</CardTitle>
                  <CardDescription>
                    {t("profile.updatePersonalInfo")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="username">{t("profile.username")}</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          setUsernameError("");
                        }}
                        placeholder={t("profile.enterUsername")}
                        disabled={isUpdating}
                        className={`max-w-md ${
                          usernameError ? "border-destructive" : ""
                        }`}
                      />
                      {usernameError && (
                        <p className="text-sm text-destructive">
                          {usernameError}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="phoneNumber"
                        className="flex items-center gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        {t("profile.phoneNumber")}
                      </Label>
                      <Input
                        id="phoneNumber"
                        value={profile?.phoneNumber || ""}
                        placeholder={t("profile.enterPhone")}
                        disabled={true}
                        className="max-w-md bg-muted cursor-not-allowed"
                      />
                      <p className="text-sm text-muted-foreground italic">
                        {t("profile.phoneNumberReadOnly") ||
                          "Phone number cannot be changed"}
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isUpdating}
                      className="max-w-md"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t("profile.updating")}
                        </>
                      ) : (
                        t("profile.updateProfile")
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Password Tab */}
            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>{t("profile.updateAccountPassword")}</CardTitle>
                  <CardDescription>
                    {t("profile.updateAccountPassword")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">
                        {t("profile.currentPassword")}
                      </Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => {
                          setCurrentPassword(e.target.value);
                          setPasswordErrors((prev) => ({
                            ...prev,
                            currentPassword: undefined,
                          }));
                        }}
                        placeholder={t("profile.enterCurrentPassword")}
                        disabled={isChangingPassword}
                        className={`max-w-md ${
                          passwordErrors.currentPassword
                            ? "border-destructive"
                            : ""
                        }`}
                      />
                      {passwordErrors.currentPassword && (
                        <p className="text-sm text-destructive">
                          {passwordErrors.currentPassword}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">
                        {t("profile.newPassword")}
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setPasswordErrors((prev) => ({
                            ...prev,
                            newPassword: undefined,
                            confirmPassword: undefined,
                          }));
                        }}
                        placeholder={t("profile.enterNewPassword")}
                        disabled={isChangingPassword}
                        className={`max-w-md ${
                          passwordErrors.newPassword ? "border-destructive" : ""
                        }`}
                      />
                      {passwordErrors.newPassword ? (
                        <p className="text-sm text-destructive">
                          {passwordErrors.newPassword}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Password must be at least 6 characters long
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        {t("profile.confirmPassword")}
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setPasswordErrors((prev) => ({
                            ...prev,
                            confirmPassword: undefined,
                          }));
                        }}
                        placeholder={t("profile.confirmNewPassword")}
                        disabled={isChangingPassword}
                        className={`max-w-md ${
                          passwordErrors.confirmPassword
                            ? "border-destructive"
                            : ""
                        }`}
                      />
                      {passwordErrors.confirmPassword && (
                        <p className="text-sm text-destructive">
                          {passwordErrors.confirmPassword}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isChangingPassword}
                      className="max-w-md"
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t("profile.changing")}
                        </>
                      ) : (
                        t("profile.changePassword")
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

