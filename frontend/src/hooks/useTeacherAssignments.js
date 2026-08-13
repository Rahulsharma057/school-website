"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignTeacher,
  getMyAssignments,
  getAllAssignments,
  removeAssignment,
} from "@/services/teacherAssignmentService";
import { toast } from "react-toastify";

export function useAssignTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => assignTeacher(data),
    onSuccess: () => {
      toast.success("Teacher assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Assignment failed");
    },
  });
}

export function useMyAssignments() {
  return useQuery({
    queryKey: ["my-assignments"],
    queryFn: async () => {
      const res = await getMyAssignments();
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAllAssignments(params = {}) {
  return useQuery({
    queryKey: ["assignments", params],
    queryFn: async () => {
      const res = await getAllAssignments(params);
      return res.data.data;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useRemoveAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => removeAssignment(id),
    onSuccess: () => {
      toast.success("Assignment removed");
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to remove");
    },
  });
}