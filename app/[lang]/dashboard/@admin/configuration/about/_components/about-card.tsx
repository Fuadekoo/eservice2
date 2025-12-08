"use client";

import { About } from "../_types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import Image from "next/image";

interface AboutCardProps {
  about: About;
  onEdit: (about: About) => void;
  onDelete: (about: About) => void;
}

export function AboutCard({ about, onEdit, onDelete }: AboutCardProps) {
  const imageUrl = about.image
    ? `/api/filedata/${about.image}`
    : "/placeholder-image.png";

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video w-full bg-muted">
        {about.image ? (
          <Image
            src={imageUrl}
            alt={about.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-dvh text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <CardHeader>
        <CardTitle className="line-clamp-1">{about.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {about.description || "No description"}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(about)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1"
            onClick={() => onDelete(about)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

