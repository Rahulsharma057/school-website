"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "react-toastify";

import { deleteMenu } from "@/services/navbarService";

export default function useDeleteMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMenu,

    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: ["navbar"],
      });

      toast.success(
        res.data.message || "Menu deleted successfully"
      );
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Delete failed"
      );
    },
  });
}