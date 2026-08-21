"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  generateFinalResults,
  getClassFinalResults,
  getMyFinalResults,
  publishFinalResults,
  getFinalResultById,generateSchoolFinalResult,
} from "@/services/finalResultService";

import { toast } from "react-toastify";

// =====================================================
// GENERATE FINAL RESULTS
// =====================================================

export function useGenerateFinalResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) =>
      generateFinalResults(data),

    onSuccess: (res) => {
      toast.success(
        res?.data?.message ||
          "Final results generated successfully"
      );

      queryClient.invalidateQueries({
        queryKey: ["class-final-results"],
      });
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to generate final results"
      );
    },
  });
}

// =====================================================
// GET CLASS FINAL RESULTS
// =====================================================

export function useClassFinalResults({
  classId,
  academicYear,
} = {}) {
  return useQuery({
    queryKey: [
      "class-final-results",
      classId,
      academicYear || "",
    ],

    queryFn: async () => {
      const res = await getClassFinalResults({
        classId,
        academicYear,
      });

      return res.data.data;
    },

    enabled:
      !!classId &&
      !!academicYear,

    staleTime: 1000 * 60 * 2,
  });
}

// =====================================================
// GET MY FINAL RESULTS
// =====================================================

export function useMyFinalResults() {
  return useQuery({
    queryKey: ["my-final-results"],

    queryFn: async () => {
      const res =
        await getMyFinalResults();

      return res.data.data;
    },

    staleTime: 1000 * 60 * 5,
  });
}

// =====================================================
// PUBLISH FINAL RESULTS
// =====================================================

export function usePublishFinalResults() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (data) =>
      publishFinalResults(data),

    onSuccess: (res) => {
      toast.success(
        res?.data?.message ||
          "Final results published successfully"
      );

      // Staff/Class result refresh
      queryClient.invalidateQueries({
        queryKey: ["class-final-results"],
      });

      // Student result refresh
      queryClient.invalidateQueries({
        queryKey: ["my-final-results"],
      });
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to publish final results"
      );
    },
  });
}

// =====================================================
// GET SINGLE FINAL RESULT
// =====================================================

export function useFinalResultById(id) {
  return useQuery({
    queryKey: [
      "final-result",
      id,
    ],

    queryFn: async () => {
      const res =
        await getFinalResultById(id);

      return res.data.data;
    },

    enabled: !!id,

    staleTime: 1000 * 60 * 5,
  });
}

// =====================================================
// GENERATE SCHOOL FINAL RESULT
// =====================================================

export function useGenerateSchoolFinalResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) =>
      generateSchoolFinalResult(data),

    onSuccess: (res) => {
      toast.success(
        res?.data?.message ||
          "School final result generated successfully"
      );

      queryClient.invalidateQueries({
        queryKey: ["class-final-results"],
      });

      queryClient.invalidateQueries({
        queryKey: ["my-final-results"],
      });
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to generate school final result"
      );
    },
  });
}