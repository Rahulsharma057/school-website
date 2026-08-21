"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
} from "@/services/programService";
import { toast } from "react-toastify";

// =====================================================
// GET ALL PROGRAMS
// =====================================================

export function usePrograms(params = {}) {
  return useQuery({
    queryKey: ["programs", params],

    queryFn: async () => {
      const res = await getAllPrograms(params);
      return res.data.data;
    },

    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
}

// =====================================================
// GET SINGLE PROGRAM
// =====================================================

export function useProgram(programId) {
  return useQuery({
    queryKey: ["program", programId],

    queryFn: async () => {
      const res = await getProgramById(programId);
      return res.data.data;
    },

    enabled: !!programId,
    staleTime: 1000 * 60 * 10,
  });
}

// =====================================================
// CREATE PROGRAM
// =====================================================

export function useCreateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createProgram(data),

    onSuccess: () => {
      toast.success("Program created successfully");
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to create program"
      );
    },
  });
}

// =====================================================
// UPDATE PROGRAM
// =====================================================

export function useUpdateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateProgram(id, data),

    onSuccess: (_res, variables) => {
      toast.success("Program updated successfully");
      queryClient.invalidateQueries({ queryKey: ["programs"] });

      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ["program", variables.id] });
      }
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to update program"
      );
    },
  });
}

// =====================================================
// DELETE PROGRAM
// =====================================================

export function useDeleteProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteProgram(id),

    onSuccess: () => {
      toast.success("Program deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete program"
      );
    },
  });
}