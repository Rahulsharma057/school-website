"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "react-toastify";

import { updateMenuOrder } from "@/services/navbarService";

export default function useMenuOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMenuOrder,

    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: ["navbar"],
      });

      toast.success(
        res.data.message || "Menu order updated"
      );
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to update order"
      );
    },
  });
}