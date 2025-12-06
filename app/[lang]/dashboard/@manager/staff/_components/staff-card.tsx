"use client";

import { Staff } from "../_types";
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
  User,
  Building2,
  MoreVertical,
  Edit,
  Trash2,
  Phone,
  Shield,
} from "lucide-react";

interface StaffCardProps {
  staff: Staff;
  onEdit: (staff: Staff) => void;
  onDelete: (staff: Staff) => void;
}

export function StaffCard({
  staff,
  onEdit,
  onDelete,
}: StaffCardProps) {
  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0 ring-2 ring-border">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold truncate">
                {staff.username}
              </CardTitle>
              {staff.office && (
                <div className="flex items-center gap-1 mt-1">
                  <Building2 className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate">
                    {staff.office.name}
                  </span>
                </div>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(staff)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(staff)}
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
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {staff.phoneNumber}
            </span>
          </div>
          {staff.role && (
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <Badge variant="secondary">{staff.role.name}</Badge>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Badge variant={staff.isActive ? "default" : "destructive"}>
              {staff.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t flex flex-col gap-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onEdit(staff)}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Staff
        </Button>
      </CardFooter>
    </Card>
  );
}

