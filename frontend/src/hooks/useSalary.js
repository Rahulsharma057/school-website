"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  setSalaryStructure,
  getCurrentSalaryStructure,
  generateMonthlySalary,
  addPayment,
  getTeacherSalaryHistory,
  getMySalary,
} from "@/services/salaryService";
import { toast } from "react-toastify";

export function useSetSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => setSalaryStructure(data),
    onSuccess: () => {
      toast.success("Salary structure saved");
      queryClient.invalidateQueries({ queryKey: ["salary-structure"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to save structure");
    },
  });
}

export function useCurrentSalaryStructure(teacherId) {
  return useQuery({
    queryKey: ["salary-structure", teacherId],
    queryFn: async () => {
      const res = await getCurrentSalaryStructure(teacherId);
      return res.data.data;
    },
    enabled: !!teacherId,
    retry: false,
  });
}

export function useGenerateMonthlySalary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => generateMonthlySalary(data),
    onSuccess: () => {
      toast.success("Salary generated successfully");
      queryClient.invalidateQueries({ queryKey: ["salary-history"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to generate salary");
    },
  });
}

export function useAddPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => addPayment(id, data),
    onSuccess: () => {
      toast.success("Payment recorded successfully");
      queryClient.invalidateQueries({ queryKey: ["salary-history"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Payment failed");
    },
  });
}

export function useTeacherSalaryHistory(teacherId) {
  return useQuery({
    queryKey: ["salary-history", teacherId],
    queryFn: async () => {
      const res = await getTeacherSalaryHistory(teacherId);
      return res.data.data;
    },
    enabled: !!teacherId,
  });
}

export function useMySalary() {
  return useQuery({
    queryKey: ["my-salary"],
    queryFn: async () => {
      const res = await getMySalary();
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}