"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  assignTeacher,
  getMyAssignments,
  getAllAssignments,
  updateAssignment,
  removeAssignment,
} from "@/services/teacherAssignmentService";
import { toast } from "react-toastify";

/* =========================================================
   ASSIGN TEACHER
========================================================= */

export function useAssignTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => assignTeacher(data),

    onSuccess: () => {
      toast.success("Teacher assigned successfully");

      // Admin assignments
      queryClient.invalidateQueries({
        queryKey: ["assignments"],
      });

      // Teacher's own assignments
      queryClient.invalidateQueries({
        queryKey: ["my-assignments"],
      });
    },

    onError: (error) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Assignment failed";

      toast.error(message);
    },
  });
}

/* =========================================================
   GET MY ASSIGNMENTS
   TEACHER
========================================================= */

export function useMyAssignments() {
  return useQuery({
    queryKey: ["my-assignments"],

    queryFn: async () => {
      const res = await getMyAssignments();

      return res?.data?.data || [];
    },

    staleTime: 1000 * 60 * 5,

    refetchOnWindowFocus: false,
  });
}

/* =========================================================
   GET ALL ASSIGNMENTS
   ADMIN / PRINCIPAL
========================================================= */

export function useAllAssignments(params = {}) {
  return useQuery({
    queryKey: ["assignments", params],

    queryFn: async () => {
      const res = await getAllAssignments(params);

      return res?.data?.data || [];
    },

    staleTime: 1000 * 60 * 2,

    refetchOnWindowFocus: false,
  });
}

/* =========================================================
   REMOVE / DEACTIVATE ASSIGNMENT
========================================================= */

export function useRemoveAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => {
      if (!id) {
        throw new Error("Assignment ID is required");
      }

      return removeAssignment(id);
    },

    onSuccess: () => {
      toast.success("Assignment removed successfully");

      // Refresh admin assignment list
      queryClient.invalidateQueries({
        queryKey: ["assignments"],
      });

      // Refresh teacher assignment list
      queryClient.invalidateQueries({
        queryKey: ["my-assignments"],
      });
    },

    onError: (error) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to remove assignment";

      toast.error(message);
    },
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) =>
      updateAssignment(id, data),

    onSuccess: () => {
      toast.success(
        "Assignment updated successfully",
      );

      queryClient.invalidateQueries({
        queryKey: ["assignments"],
      });

      queryClient.invalidateQueries({
        queryKey: ["my-assignments"],
      });
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          "Failed to update assignment",
      );
    },
  });
}