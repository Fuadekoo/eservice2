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
import useTranslation from "@/hooks/useTranslation";

export default function FeedbackPage() {
  const { t } = useTranslation();
  const {
    approvedRequests,
    isLoading,
    fetchApprovedRequests,
    submitFeedback,
    updateFeedback,
  } = useFeedbackStore();

  const [filter, setFilter] = useState<
    "all" | "with-feedback" | "without-feedback"
  >("all");
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
    withoutFeedback: approvedRequests.filter((req) => !req.customerSatisfaction)
      .length,
    averageRating:
      approvedRequests
        .filter((req) => req.customerSatisfaction)
        .reduce(
          (sum, req) => sum + (req.customerSatisfaction?.rating || 0),
          0
        ) /
      (approvedRequests.filter((req) => req.customerSatisfaction).length || 1),
  };

  return (
    <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6 h-dvh overflow-y-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
            {t("navigation.feedback")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {t("dashboard.shareExperienceAndRate")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Select
            value={filter}
            onValueChange={(value: any) => setFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t("dashboard.filterFeedback")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("dashboard.allRequests")}</SelectItem>
              <SelectItem value="with-feedback">
                {t("dashboard.withFeedback")}
              </SelectItem>
              <SelectItem value="without-feedback">
                {t("dashboard.withoutFeedback")}
              </SelectItem>
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
            {t("common.refresh")}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {approvedRequests.length > 0 && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-1">
                  {t("dashboard.totalRequests")}
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1">
                  {stats.total}
                </p>
              </div>
              <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground/50 shrink-0 ml-2" />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-1">
                  {t("dashboard.withFeedback")}
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1 text-green-600">
                  {stats.withFeedback}
                </p>
              </div>
              <Star className="w-6 h-6 sm:w-8 sm:h-8 text-green-600/50 shrink-0 ml-2" />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-1">
                  {t("dashboard.pendingFeedback")}
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1 text-orange-600">
                  {stats.withoutFeedback}
                </p>
              </div>
              <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600/50 shrink-0 ml-2" />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-1">
                  {t("dashboard.averageRating")}
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1 text-yellow-600">
                  {stats.averageRating > 0
                    ? stats.averageRating.toFixed(1)
                    : "—"}
                </p>
              </div>
              <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600/50 fill-yellow-600/50 shrink-0 ml-2" />
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">
            {t("dashboard.loadingApprovedRequests")}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && approvedRequests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Star className="w-20 h-20 text-muted-foreground mb-6" />
          <h3 className="text-xl font-semibold mb-2">
            {t("dashboard.noApprovedRequestsYet")}
          </h3>
          <p className="text-muted-foreground">
            {t("dashboard.needApprovedRequestsForFeedback")}
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
              {t("dashboard.noRequestsFound")}
            </h3>
            <p className="text-muted-foreground">
              {filter === "with-feedback"
                ? t("dashboard.noFeedbackProvidedYet")
                : t("dashboard.allRequestsHaveFeedback")}
            </p>
          </div>
        )}

      {/* Feedback Cards Grid */}
      {!isLoading && filteredRequests.length > 0 && (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
