"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enterResult, getMyResults, getClassResults } from "@/services/resultService";
import { toast } from "react-toastify";

export function useEnterResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => enterResult(data),
    onSuccess: () => {
      toast.success("Result saved successfully");
      queryClient.invalidateQueries({ queryKey: ["class-results"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to save result");
    },
  });
}

export function useMyResults() {
  return useQuery({
    queryKey: ["my-results"],
    queryFn: async () => {
      const res = await getMyResults();
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useClassResults(examId) {
  return useQuery({
    queryKey: ["class-results", examId],
    queryFn: async () => {
      const res = await getClassResults(examId);
      return res.data.data;
    },
    enabled: !!examId,
  });
}