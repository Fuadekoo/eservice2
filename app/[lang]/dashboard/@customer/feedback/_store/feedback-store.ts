import { create } from "zustand";
import { RequestWithFeedback, Feedback } from "../_types";

interface FeedbackStore {
  approvedRequests: RequestWithFeedback[];
  isLoading: boolean;
  fetchApprovedRequests: () => Promise<void>;
  submitFeedback: (
    requestId: string,
    rating: number,
    comment?: string
  ) => Promise<void>;
  updateFeedback: (
    requestId: string,
    rating: number,
    comment?: string
  ) => Promise<void>;
}

export const useFeedbackStore = create<FeedbackStore>((set, get) => ({
  approvedRequests: [],
  isLoading: false,

  fetchApprovedRequests: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch("/api/request?status=approved");
      const result = await response.json();

      if (result.success) {
        // Filter only approved requests (both staff and admin approved)
        const approved = result.data.filter(
          (req: any) =>
            req.statusbystaff === "approved" &&
            req.statusbyadmin === "approved"
        );
        set({ approvedRequests: approved, isLoading: false });
      } else {
        throw new Error(result.error || "Failed to fetch requests");
      }
    } catch (error) {
      console.error("Error fetching approved requests:", error);
      set({ isLoading: false });
    }
  },

  submitFeedback: async (requestId, rating, comment) => {
    try {
      const response = await fetch(`/api/feedback/${requestId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          comment: comment || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh requests to get updated feedback
        await get().fetchApprovedRequests();
      } else {
        throw new Error(result.error || "Failed to submit feedback");
      }
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      throw error;
    }
  },

  updateFeedback: async (requestId, rating, comment) => {
    try {
      const response = await fetch(`/api/feedback/${requestId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          comment: comment || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh requests to get updated feedback
        await get().fetchApprovedRequests();
      } else {
        throw new Error(result.error || "Failed to update feedback");
      }
    } catch (error: any) {
      console.error("Error updating feedback:", error);
      throw error;
    }
  },
}));

