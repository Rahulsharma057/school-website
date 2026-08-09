"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "react-toastify";

import { updateNavbar } from "@/services/navbarService";

export default function useCreateNavbar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNavbar,

    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: ["navbar"],
      });

      toast.success(
        res.data.message || "Navbar updated successfully"
      );
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Something went wrong"
      );
    },
  });
}