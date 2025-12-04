"use client";

import { User } from "../_types";
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
  User as UserIcon,
  Mail,
  Phone,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  Building2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

// Get initials from name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const initials = getInitials(user.name);

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="w-14 h-14 ring-2 ring-border">
              <AvatarImage src={user.image || undefined} alt={user.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-bold truncate mb-1">
                {user.name}
              </CardTitle>
              {user.username && (
                <CardDescription className="text-xs line-clamp-1 mt-0.5">
                  @{user.username}
                </CardDescription>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(user)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {user.role && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {user.role.name}
            </Badge>
          )}
          {user.office && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {user.office.name}
            </Badge>
          )}
        </div>

        <div className="space-y-2 text-sm">
          {user.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" />
            <span className="truncate">{user.phoneNumber}</span>
            {user.phoneNumberVerified && (
              <Badge variant="outline" className="ml-1 text-xs">
                Verified
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t">
        <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Created {new Date(user.createdAt).toLocaleDateString()}
          </span>
          {user.emailVerified && (
            <Badge variant="outline" className="text-xs">
              Email Verified
            </Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

