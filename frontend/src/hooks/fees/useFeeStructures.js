"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  getFeeStructures,
  getFeeStructure,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
} from "@/services/feeStructureService";

export const useFeeStructures = (params) =>
  useQuery({
    queryKey: ["fee-structures", params],
    queryFn: async () => (await getFeeStructures(params)).data?.data,
  });

export const useFeeStructure = (id) =>
  useQuery({
    queryKey: ["fee-structure", id],
    queryFn: async () => (await getFeeStructure(id)).data?.data,
    enabled: Boolean(id),
  });

export const useSaveFeeStructure = (id) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => (id ? updateFeeStructure(id, data) : createFeeStructure(data)),
    onSuccess: () => {
      toast.success(id ? "Fee structure updated" : "Fee structure created");
      queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Something went wrong"),
  });
};

export const useDeleteFeeStructure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteFeeStructure(id),
    onSuccess: () => {
      toast.success("Fee structure deleted");
      queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Delete failed"),
  });
};