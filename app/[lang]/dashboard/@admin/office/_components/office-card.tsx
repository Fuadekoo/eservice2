"use client";

import { useState, useEffect } from "react";
import { Office } from "../_types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  Phone,
  MoreVertical,
  Edit,
  Trash2,
  Power,
  FileText,
  Calendar,
  Users,
  ExternalLink,
  Briefcase,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";

interface OfficeCardProps {
  office: Office;
  onEdit: (office: Office) => void;
  onDelete: (office: Office) => void;
  onToggleStatus?: (office: Office) => void;
  onViewDetails?: (office: Office) => void;
}

// Helper function to validate if a string is a valid URL or relative path
function isValidUrl(urlString: string | null | undefined): boolean {
  if (!urlString || urlString.trim() === "") return false;

  // Check if it's a relative path (starts with /)
  if (urlString.startsWith("/")) {
    return true;
  }

  // Check if it's an absolute URL
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function OfficeCard({
  office,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewDetails,
}: OfficeCardProps) {
  const [imageError, setImageError] = useState(false);
  const hasValidLogo = office.logo && isValidUrl(office.logo) && !imageError;

  // Reset image error when office changes
  useEffect(() => {
    setImageError(false);
  }, [office.logo]);

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {hasValidLogo ? (
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0 ring-2 ring-border">
                <Image
                  src={office.logo!}
                  alt={office.name}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0 ring-2 ring-border">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-bold truncate mb-1">
                {office.name}
              </CardTitle>
              {office.slogan && (
                <CardDescription className="text-xs line-clamp-2 mt-0.5">
                  {office.slogan}
                </CardDescription>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(office)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(office)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
          <span className="line-clamp-2 text-muted-foreground flex-1">
            {office.address}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="w-4 h-4 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">
            Room: <span className="font-medium">{office.roomNumber}</span>
          </span>
        </div>
        {office.phoneNumber && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">{office.phoneNumber}</span>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-foreground">
              {office.totalServices ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">Services</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-foreground">
              {office.totalRequests ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">Requests</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-foreground">
              {office.totalAppointments ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">Appointments</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-foreground">
              {office.totalUsers ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">Users</div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3 mt-2">
          <Badge
            variant={office.status ? "default" : "secondary"}
            className="w-fit"
          >
            {office.status ? "Active" : "Inactive"}
          </Badge>
          {onToggleStatus && (
            <div className="flex items-center gap-2">
              <Power
                className={`w-4 h-4 ${
                  office.status ? "text-green-600" : "text-muted-foreground"
                }`}
              />
              <Switch
                checked={office.status}
                onCheckedChange={() => {
                  if (!office.id) {
                    console.error(
                      "❌ Cannot toggle status: Office ID is missing",
                      office
                    );
                    return;
                  }
                  onToggleStatus(office);
                }}
                aria-label={`Toggle ${office.name} status`}
              />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground border-t bg-muted/30 pt-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1">
            <span className="font-medium">Started:</span>
            <span>
              {new Date(office.startedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          {onViewDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewDetails(office)}
              className="h-7 text-xs"
            >
              View Details
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
