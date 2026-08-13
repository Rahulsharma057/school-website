"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addAdjustment, getAdjustments } from "@/services/salaryAdjustmentService";
import { toast } from "react-toastify";

export function useAddAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => addAdjustment(data),
    onSuccess: () => {
      toast.success("Adjustment added");
      queryClient.invalidateQueries({ queryKey: ["salary-history"] });
      queryClient.invalidateQueries({ queryKey: ["adjustments"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to add adjustment");
    },
  });
}

export function useAdjustments(salaryId) {
  return useQuery({
    queryKey: ["adjustments", salaryId],
    queryFn: async () => {
      const res = await getAdjustments(salaryId);
      return res.data.data;
    },
    enabled: !!salaryId,
  });
}