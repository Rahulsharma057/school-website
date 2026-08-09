"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "react-toastify";

import { addMenu } from "@/services/navbarService";

export default function useAddMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addMenu,

    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: ["navbar"],
      });

      toast.success(
        res.data.message || "Menu added successfully"
      );
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to add menu"
      );
    },
  });
}