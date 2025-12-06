"use client";

import { Service } from "../_types";
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
  FileText,
  Building2,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  UserPlus,
  Eye,
} from "lucide-react";

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  onAssignStaff: (service: Service) => void;
  onViewDetails: (service: Service) => void;
}

export function ServiceCard({
  service,
  onEdit,
  onDelete,
  onAssignStaff,
  onViewDetails,
}: ServiceCardProps) {
  const assignedStaffCount = service.assignedStaff?.length || 0;

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0 ring-2 ring-border">
              <FileText className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold truncate">
                {service.name}
              </CardTitle>
              {service.office && (
                <div className="flex items-center gap-1 mt-1">
                  <Building2 className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate">
                    {service.office.name}
                  </span>
                </div>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails(service)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(service)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAssignStaff(service)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Assign Staff
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(service)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        <CardDescription className="line-clamp-3 min-h-[60px]">
          {service.description}
        </CardDescription>

        <div className="mt-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {assignedStaffCount} staff assigned
          </span>
          {assignedStaffCount > 0 && (
            <Badge variant="secondary" className="ml-auto">
              Active
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t flex flex-col gap-2">
        <Button className="w-full" onClick={() => onViewDetails(service)}>
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onAssignStaff(service)}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Manage Staff
        </Button>
      </CardFooter>
    </Card>
  );
}
