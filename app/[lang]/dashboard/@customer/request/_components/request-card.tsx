"use client";

import { Request, RequestStatus } from "../_types";
import { calculateOverallStatus } from "@/lib/request-status";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  MapPin,
  Calendar,
  Building2,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

interface RequestCardProps {
  request: Request;
  onViewDetails: (request: Request) => void;
  onEdit: (request: Request) => void;
  onDelete: (request: Request) => void;
}

const statusConfig: Record<
  RequestStatus,
  { label: string; variant: "default" | "secondary" | "destructive"; icon: any }
> = {
  pending: {
    label: "Pending",
    variant: "secondary",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    variant: "default",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    variant: "destructive",
    icon: XCircle,
  },
};

export function RequestCard({
  request,
  onViewDetails,
  onEdit,
  onDelete,
}: RequestCardProps) {
  const overallStatus = calculateOverallStatus(
    request.statusbystaff,
    request.statusbyadmin
  );
  const statusInfo = statusConfig[overallStatus];
  const StatusIcon = statusInfo.icon;
  const canEdit = overallStatus === RequestStatus.PENDING;
  const canDelete = overallStatus === RequestStatus.PENDING;

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold line-clamp-1">
              {request.service.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Building2 className="w-3 h-3 shrink-0" />
              <span className="truncate">{request.service.office.name}</span>
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails(request)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit(request)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(request)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Address */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <span className="text-muted-foreground line-clamp-2">
            {request.currentAddress}
          </span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">
            {format(new Date(request.date), "MMM dd, yyyy")}
          </span>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-foreground">
              {request.appointments.length}
            </div>
            <div className="text-xs text-muted-foreground">Appointments</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-foreground">
              {request.fileData.length}
            </div>
            <div className="text-xs text-muted-foreground">Files</div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          <Badge
            variant={statusInfo.variant}
            className="flex items-center gap-1.5"
          >
            <StatusIcon className="w-3 h-3" />
            {statusInfo.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {format(new Date(request.createdAt), "MMM dd, yyyy")}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
