"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "@/services/subjectService";
import { toast } from "react-toastify";

// =====================================================
// GET ALL SUBJECTS
// =====================================================

export function useSubjects(params = {}) {
  return useQuery({
    queryKey: ["subjects", params],

    queryFn: async () => {
      const res = await getAllSubjects(params);
      return res.data.data;
    },

    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

// =====================================================
// CREATE SUBJECT
// =====================================================

export function useCreateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createSubject(data),

    onSuccess: () => {
      toast.success("Subject created successfully");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to create subject"
      );
    },
  });
}

// =====================================================
// UPDATE SUBJECT
// =====================================================

export function useUpdateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateSubject(id, data),

    onSuccess: () => {
      toast.success("Subject updated successfully");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to update subject"
      );
    },
  });
}

// =====================================================
// DELETE SUBJECT
// =====================================================

export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteSubject(id),

    onSuccess: () => {
      toast.success("Subject deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete subject"
      );
    },
  });
}