"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTask, getAllTasks, getMyTasks, getTaskById,
  updateTaskStatus, addTaskMessage, deleteTask, getTaskStats,
} from "@/services/taskService";
import { toast } from "react-toastify";

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => createTask(data),
    onSuccess: () => {
      toast.success("Task assigned successfully");
      qc.invalidateQueries({ queryKey: ["all-tasks"] });
      qc.invalidateQueries({ queryKey: ["task-stats"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed to assign task"),
  });
}

export function useAllTasks(params = {}) {
  return useQuery({
    queryKey: ["all-tasks", params],
    queryFn: async () => (await getAllTasks(params)).data.data,
    keepPreviousData: true,
  });
}

export function useMyTasks(params = {}) {
  return useQuery({
    queryKey: ["my-tasks", params],
    queryFn: async () => (await getMyTasks(params)).data.data,
    keepPreviousData: true,
  });
}

export function useTaskById(id) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: async () => (await getTaskById(id)).data.data,
    enabled: !!id,
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateTaskStatus(id, data),
    onSuccess: (_res, variables) => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["task", variables.id] });
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      qc.invalidateQueries({ queryKey: ["all-tasks"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Update failed"),
  });
}

export function useAddTaskMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => addTaskMessage(id, data),
    onSuccess: (_res, variables) => {
      qc.invalidateQueries({ queryKey: ["task", variables.id] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed to send message"),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteTask(id),
    onSuccess: () => {
      toast.success("Task deleted");
      qc.invalidateQueries({ queryKey: ["all-tasks"] });
      qc.invalidateQueries({ queryKey: ["task-stats"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Delete failed"),
  });
}

export function useTaskStats() {
  return useQuery({
    queryKey: ["task-stats"],
    queryFn: async () => (await getTaskStats()).data.data,
  });
}