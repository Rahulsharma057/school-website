"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  applyLeave,
  getMyLeaveRequests,
  getAllLeaveRequests,
  reviewLeaveRequest,
} from "@/services/leaveRequestService";
import { toast } from "react-toastify";

export function useApplyLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => applyLeave(data),
    onSuccess: () => {
      toast.success("Leave request submitted");
      queryClient.invalidateQueries({ queryKey: ["my-leave-requests"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to apply leave");
    },
  });
}

export function useMyLeaveRequests() {
  return useQuery({
    queryKey: ["my-leave-requests"],
    queryFn: async () => {
      const res = await getMyLeaveRequests();
      return res.data.data;
    },
  });
}

export function useAllLeaveRequests(params = {}) {
  return useQuery({
    queryKey: ["all-leave-requests", params],
    queryFn: async () => {
      const res = await getAllLeaveRequests(params);
      return res.data.data;
    },
  });
}

export function useReviewLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => reviewLeaveRequest(id, data),
    onSuccess: () => {
      toast.success("Leave request reviewed");
      queryClient.invalidateQueries({ queryKey: ["all-leave-requests"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Review failed");
    },
  });
}