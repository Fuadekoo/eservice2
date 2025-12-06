"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Building2,
  MapPin,
  Star,
  Edit,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { RequestWithFeedback } from "../_types";
import { toast } from "sonner";

interface FeedbackCardProps {
  request: RequestWithFeedback;
  onSubmit: (
    requestId: string,
    rating: number,
    comment?: string
  ) => Promise<void>;
  isSubmitting?: boolean;
}

export function FeedbackCard({
  request,
  onSubmit,
  isSubmitting = false,
}: FeedbackCardProps) {
  const [isEditing, setIsEditing] = useState(!request.customerSatisfaction);
  const [rating, setRating] = useState<number>(
    request.customerSatisfaction?.rating || 0
  );
  const [comment, setComment] = useState<string>(
    request.customerSatisfaction?.comment || ""
  );
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);

  const hasFeedback = !!request.customerSatisfaction;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmittingLocal(true);
    try {
      await onSubmit(request.id, rating, comment.trim() || undefined);
      setIsEditing(false);
      toast.success(
        hasFeedback
          ? "Feedback updated successfully"
          : "Feedback submitted successfully"
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to save feedback");
    } finally {
      setIsSubmittingLocal(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">
              {request.service.name}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(request.date), "PPP")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                <span>{request.service.office.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span className="truncate max-w-[200px]">
                  {request.service.office.address}
                </span>
              </div>
            </div>
          </div>
          {hasFeedback && !isEditing && (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Feedback Provided
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor={`rating-${request.id}`}>
                Your Rating <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-4">
                <StarRating
                  rating={rating}
                  onRatingChange={setRating}
                  size="lg"
                />
                {rating > 0 && (
                  <span className="text-sm font-medium text-muted-foreground">
                    {rating} {rating === 1 ? "star" : "stars"}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`comment-${request.id}`}>
                Your Feedback (Optional)
              </Label>
              <Textarea
                id={`comment-${request.id}`}
                placeholder="Share your experience, suggestions, or any comments about this request..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSubmittingLocal || isSubmitting || rating === 0}
                className="flex-1"
              >
                {isSubmittingLocal || isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {hasFeedback ? "Updating..." : "Submitting..."}
                  </>
                ) : hasFeedback ? (
                  "Update Feedback"
                ) : (
                  "Submit Feedback"
                )}
              </Button>
              {hasFeedback && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setRating(request.customerSatisfaction?.rating || 0);
                    setComment(request.customerSatisfaction?.comment || "");
                  }}
                  disabled={isSubmittingLocal || isSubmitting}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {hasFeedback && (
              <>
                <div className="flex items-center gap-3 pb-3 border-b">
                  <div className="flex items-center gap-2">
                    <StarRating
                      rating={request.customerSatisfaction.rating}
                      readonly
                      size="md"
                    />
                    <span className="text-sm font-medium">
                      {request.customerSatisfaction.rating} out of 5 stars
                    </span>
                  </div>
                </div>

                {request.customerSatisfaction.comment && (
                  <div className="space-y-2">
                    <Label>Your Feedback</Label>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm whitespace-pre-wrap">
                        {request.customerSatisfaction.comment}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Submitted on{" "}
                    {format(
                      new Date(request.customerSatisfaction.createdAt),
                      "PPP 'at' p"
                    )}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    disabled={isSubmitting || isSubmittingLocal}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Feedback
                  </Button>
                </div>
              </>
            )}
            {!hasFeedback && (
              <div className="text-center py-6 text-muted-foreground">
                <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No feedback provided yet</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsEditing(true)}
                >
                  Add Feedback
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

