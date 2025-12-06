"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Office } from "../_types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  ArrowLeft,
  FileText,
  Calendar,
  Users,
  MapPin,
  Phone,
  Loader2,
  Edit,
  RefreshCw,
  Briefcase,
  Eye,
  Shield,
  X,
  UserPlus,
  UserMinus,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface OfficeDetailStats {
  totalServices: number;
  totalRequests: number;
  totalAppointments: number;
  totalUsers: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  pendingAppointments: number;
  approvedAppointments: number;
  rejectedAppointments: number;
  roles: { id: string; name: string }[];
}

interface Service {
  id: string;
  name: string;
  description: string;
}

interface Manager {
  id: string;
  username: string;
  phoneNumber: string;
  role: {
    id: string;
    name: string;
  } | null;
}

interface User {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
}

export default function OfficeDetailPage() {
  const params = useParams<{ lang: string; id: string }>();
  const router = useRouter();
  const lang = params.lang || "en";
  const officeId = params.id as string;

  const [office, setOffice] = useState<Office | null>(null);
  const [stats, setStats] = useState<OfficeDetailStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isServicesDialogOpen, setIsServicesDialogOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [manager, setManager] = useState<Manager | null>(null);
  const [isLoadingManager, setIsLoadingManager] = useState(false);
  const [isManagerDialogOpen, setIsManagerDialogOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isAssigningManager, setIsAssigningManager] = useState(false);
  const [createNewUser, setCreateNewUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");

  useEffect(() => {
    if (officeId) {
      fetchOfficeDetails();
    }
  }, [officeId]);

  const fetchOfficeDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch office details
      const officeResponse = await fetch(`/api/office/${officeId}`, {
        cache: "no-store",
      });

      if (!officeResponse.ok) {
        throw new Error("Failed to fetch office details");
      }

      const officeResult = await officeResponse.json();
      if (!officeResult.success) {
        throw new Error(officeResult.error || "Failed to fetch office");
      }

      const officeData = {
        ...officeResult.data,
        startedAt: new Date(officeResult.data.startedAt),
        createdAt: new Date(officeResult.data.createdAt),
        updatedAt: new Date(officeResult.data.updatedAt),
      };

      setOffice(officeData);

      // Fetch detailed statistics
      const statsResponse = await fetch(`/api/office/${officeId}/stats`, {
        cache: "no-store",
      });

      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        if (statsResult.success) {
          setStats(statsResult.data);
        }
      }

      // Fetch manager
      fetchManager();
    } catch (err: any) {
      console.error("❌ Error fetching office details:", err);
      setError(err.message || "Failed to load office details");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      setIsLoadingServices(true);
      const response = await fetch(`/api/service?officeId=${officeId}`, {
        cache: "no-store",
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setServices(result.data || []);
        }
      }
    } catch (err) {
      console.error("Error fetching services:", err);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const handleViewServices = () => {
    setIsServicesDialogOpen(true);
    if (services.length === 0) {
      fetchServices();
    }
  };

  const fetchManager = async () => {
    try {
      setIsLoadingManager(true);
      const response = await fetch(`/api/office/${officeId}/manager`, {
        cache: "no-store",
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setManager(result.data);
        }
      }
    } catch (err) {
      console.error("Error fetching manager:", err);
    } finally {
      setIsLoadingManager(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const response = await fetch("/api/user", {
        cache: "no-store",
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setAvailableUsers(result.data);
        }
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Failed to fetch users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleOpenManagerDialog = () => {
    setIsManagerDialogOpen(true);
    // If no manager exists, default to "Create New User" tab
    if (!manager) {
      setCreateNewUser(true);
    } else {
      setCreateNewUser(false);
    }
    if (availableUsers.length === 0 && !createNewUser) {
      fetchAvailableUsers();
    }
  };

  const handleAssignManager = async () => {
    if (createNewUser) {
      // Create new user and assign as manager
      if (!newUserName.trim() || !newUserPhone.trim()) {
        toast.error("Name and phone number are required");
        return;
      }

      try {
        setIsAssigningManager(true);
        const response = await fetch(`/api/office/${officeId}/manager`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            createNew: true,
            name: newUserName.trim(),
            phoneNumber: newUserPhone.trim(),
            email: newUserEmail.trim() || undefined,
          }),
        });

        const result = await response.json();

        if (result.success) {
          toast.success(
            "Manager created and assigned successfully. Password sent via SMS."
          );
          setManager(result.data);
          setIsManagerDialogOpen(false);
          setCreateNewUser(false);
          setNewUserName("");
          setNewUserPhone("");
          setNewUserEmail("");
        } else {
          toast.error(result.error || "Failed to create and assign manager");
        }
      } catch (err: any) {
        console.error("Error creating manager:", err);
        toast.error("Failed to create manager");
      } finally {
        setIsAssigningManager(false);
      }
    } else {
      // Assign existing user
      if (!selectedUserId) {
        toast.error("Please select a user");
        return;
      }

      try {
        setIsAssigningManager(true);
        const response = await fetch(`/api/office/${officeId}/manager`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: selectedUserId }),
        });

        const result = await response.json();

        if (result.success) {
          toast.success("Manager assigned successfully");
          setManager(result.data);
          setIsManagerDialogOpen(false);
          setSelectedUserId("");
        } else {
          toast.error(result.error || "Failed to assign manager");
        }
      } catch (err: any) {
        console.error("Error assigning manager:", err);
        toast.error("Failed to assign manager");
      } finally {
        setIsAssigningManager(false);
      }
    }
  };

  const handleRemoveManager = async () => {
    if (!manager) return;

    if (
      !confirm(
        `Are you sure you want to remove ${manager.username} as manager?`
      )
    ) {
      return;
    }

    try {
      setIsLoadingManager(true);
      const response = await fetch(`/api/office/${officeId}/manager`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Manager removed successfully");
        setManager(null);
      } else {
        toast.error(result.error || "Failed to remove manager");
      }
    } catch (err: any) {
      console.error("Error removing manager:", err);
      toast.error("Failed to remove manager");
    } finally {
      setIsLoadingManager(false);
    }
  };

  // Helper function to validate if a string is a valid URL or relative path
  function isValidUrl(urlString: string | null | undefined): boolean {
    if (!urlString || urlString.trim() === "") return false;
    if (urlString.startsWith("/")) return true;
    try {
      const url = new URL(urlString);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  if (isLoading) {
    return (
      <div className="w-full h-full overflow-y-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading office details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !office) {
    return (
      <div className="w-full h-full overflow-y-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="w-20 h-20 text-muted-foreground mb-6" />
            <h3 className="text-xl font-semibold mb-2">Office not found</h3>
            <p className="text-muted-foreground mb-6">
              {error || "The office you're looking for doesn't exist."}
            </p>
            <Button onClick={() => router.push(`/${lang}/dashboard/office`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Offices
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const hasValidLogo = office.logo && isValidUrl(office.logo);

  return (
    <div className="w-full h-full overflow-y-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${lang}/dashboard/office`)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-4">
            {hasValidLogo ? (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted ring-2 ring-border">
                <Image
                  src={office.logo!}
                  alt={office.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-2 ring-border">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {office.name}
              </h1>
              {office.slogan && (
                <p className="text-muted-foreground mt-1">{office.slogan}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOfficeDetails}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Link href={`/${lang}/dashboard/office?edit=${office.id}`}>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Office Info */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Office Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Address</p>
                <p className="text-sm text-muted-foreground">
                  {office.address}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Room Number</p>
                <p className="text-sm text-muted-foreground">
                  {office.roomNumber}
                </p>
              </div>
            </div>
            {office.phoneNumber && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">
                    {office.phoneNumber}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={office.status ? "default" : "secondary"}>
                {office.status ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">
                  {stats?.totalServices ?? office.totalServices ?? 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Available services
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={handleViewServices}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Services
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">
                  {stats?.totalRequests ?? office.totalRequests ?? 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  All time requests
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
            </div>
            {stats && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium">{stats.pendingRequests}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Approved</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {stats.approvedRequests}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rejected</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {stats.rejectedRequests}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">
                  {stats?.totalAppointments ?? office.totalAppointments ?? 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  All time appointments
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            {stats && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium">
                    {stats.pendingAppointments}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Approved</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {stats.approvedAppointments}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rejected</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {stats.rejectedAppointments}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">
                  {stats?.totalUsers ?? office.totalUsers ?? 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Staff members
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">
                  {stats?.roles?.length ?? 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Office roles
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-orange-500" />
              </div>
            </div>
            {stats?.roles && stats.roles.length > 0 && (
              <div className="mt-4 space-y-1">
                {stats.roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between text-sm py-1"
                  >
                    <span className="text-muted-foreground">{role.name}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Office Manager</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingManager ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            ) : manager ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{manager.username}</p>
                    {manager.phoneNumber && (
                      <p className="text-sm text-muted-foreground">
                        {manager.phoneNumber}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleOpenManagerDialog}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Change Manager
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveManager}
                    disabled={isLoadingManager}
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-center py-4 text-muted-foreground">
                  <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No manager assigned</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleOpenManagerDialog}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Manager
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Services Dialog */}
      <Dialog
        open={isServicesDialogOpen}
        onOpenChange={setIsServicesDialogOpen}
      >
        <DialogContent className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Services - {office?.name}</DialogTitle>
          </DialogHeader>
          {isLoadingServices ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">
                Loading services...
              </span>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No services available for this office</p>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <Card key={service.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {service.name}
                      </h3>
                      {service.description && (
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manager Assignment Dialog */}
      <Dialog
        open={isManagerDialogOpen}
        onOpenChange={(open) => {
          setIsManagerDialogOpen(open);
          if (!open) {
            setCreateNewUser(!manager); // Reset to create mode if no manager
            setSelectedUserId("");
            setNewUserName("");
            setNewUserPhone("");
            setNewUserEmail("");
          }
        }}
      >
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>
              {manager ? "Change Manager" : "Create Manager"}
            </DialogTitle>
            <DialogDescription>
              {createNewUser
                ? "Create a new user and assign as manager for " + office?.name
                : "Select a user to assign as manager for " + office?.name}
            </DialogDescription>
          </DialogHeader>
          <Tabs
            value={createNewUser ? "create" : "existing"}
            onValueChange={(value) => {
              setCreateNewUser(value === "create");
              if (value === "existing" && availableUsers.length === 0) {
                fetchAvailableUsers();
              }
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">Existing User</TabsTrigger>
              <TabsTrigger value="create">Create New User</TabsTrigger>
            </TabsList>
            <TabsContent value="existing" className="space-y-4">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">
                    Loading users...
                  </span>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="user-select">Select User</Label>
                    <Select
                      value={selectedUserId}
                      onValueChange={setSelectedUserId}
                    >
                      <SelectTrigger id="user-select">
                        <SelectValue placeholder="Choose a user..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex flex-col">
                              <span>{user.name}</span>
                              {user.email && (
                                <span className="text-xs text-muted-foreground">
                                  {user.email}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsManagerDialogOpen(false);
                        setSelectedUserId("");
                      }}
                      disabled={isAssigningManager}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAssignManager}
                      disabled={!selectedUserId || isAssigningManager}
                    >
                      {isAssigningManager ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Assign Manager
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
            <TabsContent value="create" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-user-name">Full Name *</Label>
                  <Input
                    id="new-user-name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Enter full name"
                    disabled={isAssigningManager}
                  />
                </div>
                <div>
                  <Label htmlFor="new-user-phone">Phone Number *</Label>
                  <Input
                    id="new-user-phone"
                    type="tel"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    placeholder="0912345678"
                    disabled={isAssigningManager}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    A random 8-digit password will be generated and sent via SMS
                  </p>
                </div>
                <div>
                  <Label htmlFor="new-user-email">Email (Optional)</Label>
                  <Input
                    id="new-user-email"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="user@example.com"
                    disabled={isAssigningManager}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsManagerDialogOpen(false);
                      setNewUserName("");
                      setNewUserPhone("");
                      setNewUserEmail("");
                    }}
                    disabled={isAssigningManager}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAssignManager}
                    disabled={
                      !newUserName.trim() ||
                      !newUserPhone.trim() ||
                      isAssigningManager
                    }
                  >
                    {isAssigningManager ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create & Assign Manager
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Started Date
            </p>
            <p className="text-sm mt-1">
              {new Date(office.startedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Created Date
            </p>
            <p className="text-sm mt-1">
              {new Date(office.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
