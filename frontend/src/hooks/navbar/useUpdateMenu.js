"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { updateMenu } from "@/services/navbarService";

export default function useUpdateMenu() {

  const queryClient = useQueryClient();

  return useMutation({

    mutationFn: ({ index, data }) => {
      return updateMenu(index, data);
    },

    onSuccess: (res) => {

      queryClient.invalidateQueries({
        queryKey: ["navbar"],
      });

      toast.success(
        res.data.message || "Menu updated successfully"
      );

    },

    onError: (error) => {

      toast.error(
        error.response?.data?.message ||
        "Failed to update menu"
      );

    },

  });

}