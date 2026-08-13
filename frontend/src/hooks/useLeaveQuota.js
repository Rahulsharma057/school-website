"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { setLeaveQuota, getLeaveQuota } from "@/services/leaveQuotaService";
import { toast } from "react-toastify";

export function useLeaveQuota(teacherId, year) {
  return useQuery({
    queryKey: ["leave-quota", teacherId, year],
    queryFn: async () => {
      const res = await getLeaveQuota(teacherId, year);
      return res.data.data;
    },
    enabled: !!teacherId && !!year,
  });
}

export function useSetLeaveQuota() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => setLeaveQuota(data),
    onSuccess: () => {
      toast.success("Leave quota updated");
      queryClient.invalidateQueries({ queryKey: ["leave-quota"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update quota");
    },
  });
}