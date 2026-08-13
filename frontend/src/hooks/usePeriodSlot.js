"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPeriodSlot, getAllPeriodSlots, updatePeriodSlot, deletePeriodSlot,
} from "@/services/periodSlotService";
import { toast } from "react-toastify";

export function usePeriodSlots() {
  return useQuery({
    queryKey: ["period-slots"],
    queryFn: async () => (await getAllPeriodSlots()).data.data,
  });
}

export function useCreatePeriodSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => createPeriodSlot(data),
    onSuccess: () => {
      toast.success("Period slot added");
      qc.invalidateQueries({ queryKey: ["period-slots"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed to add period"),
  });
}

export function useUpdatePeriodSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updatePeriodSlot(id, data),
    onSuccess: () => {
      toast.success("Period slot updated");
      qc.invalidateQueries({ queryKey: ["period-slots"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Update failed"),
  });
}

export function useDeletePeriodSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deletePeriodSlot(id),
    onSuccess: () => {
      toast.success("Period slot deleted");
      qc.invalidateQueries({ queryKey: ["period-slots"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Delete failed"),
  });
}