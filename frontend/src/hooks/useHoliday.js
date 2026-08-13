"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addHoliday, getHolidaysByYear, deleteHoliday } from "@/services/holidayService";
import { toast } from "react-toastify";

export function useHolidaysByYear(year) {
  return useQuery({
    queryKey: ["holidays", year],
    queryFn: async () => {
      const res = await getHolidaysByYear(year);
      return res.data.data;
    },
    enabled: !!year,
  });
}

export function useAddHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => addHoliday(data),
    onSuccess: () => {
      toast.success("Holiday added successfully");
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to add holiday");
    },
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteHoliday(id),
    onSuccess: () => {
      toast.success("Holiday deleted");
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete");
    },
  });
}