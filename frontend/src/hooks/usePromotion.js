"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getClassStudentsForPromotion,
  bulkPromote,
  getMyAcademicHistory,
  getStudentAcademicHistory,
} from "@/services/promotionService";
import { toast } from "react-toastify";

export function useClassStudentsForPromotion(classId) {
  return useQuery({
    queryKey: ["promotion-students", classId],
    queryFn: async () => {
      const res = await getClassStudentsForPromotion(classId);
      return res.data.data;
    },
    enabled: !!classId,
  });
}

export function useBulkPromote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => bulkPromote(data),
    onSuccess: () => {
      toast.success("Promotion process completed");
      queryClient.invalidateQueries({ queryKey: ["promotion-students"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Promotion failed");
    },
  });
}

export function useMyAcademicHistory() {
  return useQuery({
    queryKey: ["my-academic-history"],
    queryFn: async () => {
      const res = await getMyAcademicHistory();
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useStudentAcademicHistory(studentId) {
  return useQuery({
    queryKey: ["academic-history", studentId],
    queryFn: async () => {
      const res = await getStudentAcademicHistory(studentId);
      return res.data.data;
    },
    enabled: !!studentId,
  });
}