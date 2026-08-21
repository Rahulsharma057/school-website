"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getClassStudentsForPromotion,
  getPromotionResult,
  bulkPromote,
  getMyAcademicHistory,
  getStudentAcademicHistory,
} from "@/services/promotionService";

import { toast } from "react-toastify";

// =====================================================
// GET CLASS STUDENTS FOR PROMOTION
// =====================================================

export function useClassStudentsForPromotion(classId) {
  return useQuery({
    queryKey: ["promotion-students", classId],

    queryFn: async () => {
      const res = await getClassStudentsForPromotion(classId);

      return res.data.data;
    },

    enabled: !!classId,

    staleTime: 1000 * 60 * 2,
  });
}

// =====================================================
// GET PROMOTION RESULTS
// =====================================================

export function usePromotionResult({ classId, academicYear } = {}) {
  return useQuery({
    queryKey: ["promotion-results", classId, academicYear || ""],

    queryFn: async () => {
      const res = await getPromotionResult({
        classId,
        academicYear,
      });

      return res.data.data;
    },

    enabled: !!classId,

    staleTime: 1000 * 60 * 2,
  });
}

// =====================================================
// BULK PROMOTE
// =====================================================

export function useBulkPromote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => bulkPromote(data),

    onSuccess: () => {
      toast.success("Promotion process completed");

      queryClient.invalidateQueries({
        queryKey: ["promotion-students"],
      });

      queryClient.invalidateQueries({
        queryKey: ["promotion-results"],
      });

      queryClient.invalidateQueries({
        queryKey: ["academic-history"],
      });

      queryClient.invalidateQueries({
        queryKey: ["classes"],
      });

      queryClient.invalidateQueries({
        queryKey: ["students"],
      });
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Promotion failed",
      );
    },
  });
}

// =====================================================
// MY ACADEMIC HISTORY
// =====================================================

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

// =====================================================
// STUDENT ACADEMIC HISTORY
// =====================================================

export function useStudentAcademicHistory(studentId) {
  return useQuery({
    queryKey: ["academic-history", studentId],

    queryFn: async () => {
      const res = await getStudentAcademicHistory(studentId);

      return res.data.data;
    },

    enabled: !!studentId,

    staleTime: 1000 * 60 * 5,
  });
}
