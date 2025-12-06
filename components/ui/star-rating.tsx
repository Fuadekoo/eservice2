"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  onRatingChange,
  maxStars = 5,
  size = "md",
  readonly = false,
  className,
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = React.useState<number | null>(null);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (!readonly) {
      setHoveredRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoveredRating(null);
    }
  };

  const displayRating = hoveredRating ?? rating;

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      onMouseLeave={handleMouseLeave}
    >
      {Array.from({ length: maxStars }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= displayRating;
        const isInteractive = !readonly && onRatingChange;

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            disabled={readonly || !isInteractive}
            className={cn(
              "transition-colors duration-150",
              isInteractive &&
                "cursor-pointer hover:scale-110 active:scale-95",
              readonly && "cursor-default"
            )}
            aria-label={`Rate ${starValue} out of ${maxStars} stars`}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-muted text-muted-foreground",
                isInteractive && !readonly && "hover:fill-yellow-300 hover:text-yellow-300"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

