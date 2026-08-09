"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  getAdminNewsList,
  getAdminNewsById,
  createNews,
  updateNews,
  deleteNews,
  reorderNews,
  updateNewsStatus,
} from "@/services/newsService";

export function useAdminNewsList(params = {}) {
  return useQuery({
    queryKey: ["news", "admin", params],
    queryFn: async () => {
      const { data } = await getAdminNewsList(params);
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useAdminNewsDetail(id) {
  return useQuery({
    queryKey: ["news", "admin", "detail", id],
    queryFn: async () => {
      const { data } = await getAdminNewsById(id);
      return data;
    },
    enabled: Boolean(id),
  });
}

export default function useNewsAdminActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["news"] });
  const errMsg = (err, fallback) => err?.response?.data?.message || fallback;

  const createMutation = useMutation({
    mutationFn: (payload) => createNews(payload),
    onSuccess: () => {
      toast.success("News created");
      invalidate();
    },
    onError: (err) => toast.error(errMsg(err, "Could not create news")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateNews(id, payload),
    onSuccess: () => {
      toast.success("News updated");
      invalidate();
    },
    onError: (err) => toast.error(errMsg(err, "Could not update news")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteNews(id),
    onSuccess: () => {
      toast.success("News deleted");
      invalidate();
    },
    onError: (err) => toast.error(errMsg(err, "Delete failed")),
  });

  // Reorder is deliberately silent on success (no toast) — it fires on
  // every drag-drop and a toast per drag would be noisy. Errors still
  // surface since a failed reorder needs the admin to know & retry.
  const reorderMutation = useMutation({
    mutationFn: (items) => reorderNews(items),
    onError: (err) => {
      toast.error(errMsg(err, "Could not save the new order"));
      invalidate(); // re-sync with server truth since the optimistic order may be wrong now
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateNewsStatus(id, status),
    onSuccess: (_res, variables) => {
      toast.success(`Marked as ${variables.status}`);
      invalidate();
    },
    onError: (err) => toast.error(errMsg(err, "Could not update status")),
  });

  return { createMutation, updateMutation, deleteMutation, reorderMutation, statusMutation };
}
