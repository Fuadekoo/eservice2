"use client";

import { Administration } from "../_types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import Image from "next/image";

interface AdministrationCardProps {
  administration: Administration;
  onEdit: (administration: Administration) => void;
  onDelete: (administration: Administration) => void;
}

export function AdministrationCard({
  administration,
  onEdit,
  onDelete,
}: AdministrationCardProps) {
  const imageUrl = administration.image
    ? `/api/filedata/${administration.image}`
    : "/placeholder-image.png";

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square w-full bg-muted">
        {administration.image ? (
          <Image
            src={imageUrl}
            alt={administration.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No photo
          </div>
        )}
      </div>
      <CardHeader>
        <CardTitle className="line-clamp-1">{administration.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {administration.description || "No description"}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(administration)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1"
            onClick={() => onDelete(administration)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

