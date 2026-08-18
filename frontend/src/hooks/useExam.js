"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createExam,
  getExamsByClass,
  updateExam,
} from "@/services/examService";

import { toast } from "react-toastify";

// =====================================================
// CREATE EXAM
// =====================================================

export function useCreateExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createExam(data),

    onSuccess: () => {
      toast.success("Exam created successfully");

      queryClient.invalidateQueries({
        queryKey: ["exams"],
      });
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to create exam"
      );
    },
  });
}

// =====================================================
// GET EXAMS BY CLASS
// =====================================================

export function useExamsByClass(classId) {
  return useQuery({
    queryKey: ["exams", classId],

    queryFn: async () => {
      const res = await getExamsByClass(classId);
      return res.data.data;
    },

    enabled: !!classId,

    staleTime: 1000 * 60 * 5,
  });
}

// =====================================================
// UPDATE EXAM
// =====================================================

export function useUpdateExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ examId, data }) =>
      updateExam(examId, data),

    onSuccess: (_, variables) => {
      toast.success("Exam updated successfully");

      // Refresh all exam lists
      queryClient.invalidateQueries({
        queryKey: ["exams"],
      });

      // If the updated exam has a class-specific query,
      // refresh that query too.
      if (variables?.data?.classId) {
        queryClient.invalidateQueries({
          queryKey: ["exams", variables.data.classId],
        });
      }
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to update exam"
      );
    },
  });
}