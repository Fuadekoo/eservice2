"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from "@/components/ui/star-rating";
import { Loader2, Calendar, Star } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface FeedbackFormProps {
  requestId: string;
  requestDate: Date;
  existingFeedback?: {
    rating: number;
    comment?: string | null;
  } | null;
  onFeedbackSubmitted?: () => void;
}

export function FeedbackForm({
  requestId,
  requestDate,
  existingFeedback,
  onFeedbackSubmitted,
}: FeedbackFormProps) {
  const [rating, setRating] = useState<number>(
    existingFeedback?.rating || 0
  );
  const [comment, setComment] = useState<string>(
    existingFeedback?.comment || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing feedback when component mounts
  useEffect(() => {
    const loadFeedback = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/feedback/${requestId}`);
        const result = await response.json();

        if (result.success && result.data) {
          setRating(result.data.rating);
          setComment(result.data.comment || "");
        }
      } catch (error) {
        console.error("Error loading feedback:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeedback();
  }, [requestId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/feedback/${requestId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          existingFeedback
            ? "Feedback updated successfully"
            : "Feedback submitted successfully"
        );
        // Reload feedback data
        const reloadResponse = await fetch(`/api/feedback/${requestId}`);
        const reloadResult = await reloadResponse.json();
        if (reloadResult.success && reloadResult.data) {
          setRating(reloadResult.data.rating);
          setComment(reloadResult.data.comment || "");
        }
        // Notify parent to refresh request data
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted();
        }
      } else {
        throw new Error(result.error || "Failed to save feedback");
      }
    } catch (error: any) {
      console.error("Error saving feedback:", error);
      toast.error(error.message || "Failed to save feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Provide Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Request Date Display */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground pb-4 border-b">
          <Calendar className="w-4 h-4" />
          <span>Request Date: {format(new Date(requestDate), "PPP")}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Section */}
          <div className="space-y-3">
            <Label htmlFor="rating">
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
            <p className="text-xs text-muted-foreground">
              Click on the stars to rate your experience (1-5 stars)
            </p>
          </div>

          {/* Comment Section */}
          <div className="space-y-2">
            <Label htmlFor="comment">Your Feedback (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Share your experience, suggestions, or any comments about this request..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Your feedback helps us improve our services
            </p>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting || rating === 0} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {existingFeedback ? "Updating..." : "Submitting..."}
              </>
            ) : existingFeedback ? (
              "Update Feedback"
            ) : (
              "Submit Feedback"
            )}
          </Button>
        </form>

        {/* Display existing feedback if available */}
        {existingFeedback && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              You can update your feedback at any time
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

