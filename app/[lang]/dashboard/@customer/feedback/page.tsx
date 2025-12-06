"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, Loader2, RefreshCw, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useFeedbackStore } from "./_store/feedback-store";
import { FeedbackCard } from "./_components/feedback-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FeedbackPage() {
  const {
    approvedRequests,
    isLoading,
    fetchApprovedRequests,
    submitFeedback,
    updateFeedback,
  } = useFeedbackStore();

  const [filter, setFilter] = useState<"all" | "with-feedback" | "without-feedback">("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchApprovedRequests();
  }, [fetchApprovedRequests]);

  const handleSubmitFeedback = async (
    requestId: string,
    rating: number,
    comment?: string
  ) => {
    setIsSubmitting(true);
    try {
      const request = approvedRequests.find((r) => r.id === requestId);
      if (request?.customerSatisfaction) {
        await updateFeedback(requestId, rating, comment);
      } else {
        await submitFeedback(requestId, rating, comment);
      }
    } catch (error: any) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter requests
  const filteredRequests =
    filter === "all"
      ? approvedRequests
      : filter === "with-feedback"
      ? approvedRequests.filter((req) => req.customerSatisfaction)
      : approvedRequests.filter((req) => !req.customerSatisfaction);

  // Calculate statistics
  const stats = {
    total: approvedRequests.length,
    withFeedback: approvedRequests.filter((req) => req.customerSatisfaction)
      .length,
    withoutFeedback: approvedRequests.filter(
      (req) => !req.customerSatisfaction
    ).length,
    averageRating:
      approvedRequests
        .filter((req) => req.customerSatisfaction)
        .reduce(
          (sum, req) =>
            sum + (req.customerSatisfaction?.rating || 0),
          0
        ) /
        (approvedRequests.filter((req) => req.customerSatisfaction).length ||
          1),
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Star className="w-8 h-8 text-yellow-500" />
            Feedback
          </h1>
          <p className="text-muted-foreground mt-1">
            Share your experience and rate your approved requests
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter feedback" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="with-feedback">With Feedback</SelectItem>
              <SelectItem value="without-feedback">Without Feedback</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchApprovedRequests()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {approvedRequests.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Requests
                </p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-muted-foreground/50" />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  With Feedback
                </p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {stats.withFeedback}
                </p>
              </div>
              <Star className="w-8 h-8 text-green-600/50" />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Feedback
                </p>
                <p className="text-2xl font-bold mt-1 text-orange-600">
                  {stats.withoutFeedback}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-orange-600/50" />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Average Rating
                </p>
                <p className="text-2xl font-bold mt-1 text-yellow-600">
                  {stats.averageRating > 0
                    ? stats.averageRating.toFixed(1)
                    : "—"}
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-600/50 fill-yellow-600/50" />
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading approved requests...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && approvedRequests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Star className="w-20 h-20 text-muted-foreground mb-6" />
          <h3 className="text-xl font-semibold mb-2">
            No approved requests yet
          </h3>
          <p className="text-muted-foreground">
            You need to have approved requests before you can provide feedback.
            Once your requests are approved, you'll see them here.
          </p>
        </div>
      )}

      {/* Filtered Empty State */}
      {!isLoading &&
        approvedRequests.length > 0 &&
        filteredRequests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MessageSquare className="w-20 h-20 text-muted-foreground mb-6" />
            <h3 className="text-xl font-semibold mb-2">
              No requests found
            </h3>
            <p className="text-muted-foreground">
              {filter === "with-feedback"
                ? "You haven't provided feedback for any requests yet."
                : "All your requests already have feedback."}
            </p>
          </div>
        )}

      {/* Feedback Cards Grid */}
      {!isLoading && filteredRequests.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRequests.map((request) => (
            <FeedbackCard
              key={request.id}
              request={request}
              onSubmit={handleSubmitFeedback}
              isSubmitting={isSubmitting}
            />
          ))}
        </div>
      )}
    </div>
  );
}

