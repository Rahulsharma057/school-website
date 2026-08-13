"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllClasses,
  createClass,
  updateClass,
  deleteClass,
} from "@/services/classService";
import { toast } from "react-toastify";

export function useClasses() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const res = await getAllClasses();
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => createClass(data),
    onSuccess: () => {
      toast.success("Class created successfully");
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create class");
    },
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateClass(id, data),
    onSuccess: () => {
      toast.success("Class updated successfully");
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Update failed");
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteClass(id),
    onSuccess: () => {
      toast.success("Class deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Delete failed");
    },
  });
}