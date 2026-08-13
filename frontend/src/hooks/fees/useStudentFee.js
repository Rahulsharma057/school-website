"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  assignFeeToStudent,
  bulkAssignFeeToClass,
  getStudentFee,
  updateStudentFeeComponent,
  addCustomFeeComponent,
  removeCustomFeeComponent,
  getClassFeeSummary,
  getDueList,
  getFeeDashboard,
} from "@/services/studentFeeService";
import { collectPayment, getPaymentHistory } from "@/services/feePaymentService";

export const useStudentFee = (id) =>
  useQuery({
    queryKey: ["student-fee", id],
    queryFn: async () => (await getStudentFee(id)).data?.data,
    enabled: Boolean(id),
  });

export const usePaymentHistory = (id) =>
  useQuery({
    queryKey: ["payment-history", id],
    queryFn: async () => (await getPaymentHistory(id)).data?.data,
    enabled: Boolean(id),
  });

export const useAssignFee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => assignFeeToStudent(data),
    onSuccess: () => {
      toast.success("Fee assigned to student");
      queryClient.invalidateQueries({ queryKey: ["class-fee-summary"] });
      queryClient.invalidateQueries({ queryKey: ["due-list"] });
      queryClient.invalidateQueries({ queryKey: ["fee-dashboard"] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Could not assign fee"),
  });
};

export const useBulkAssignFee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => bulkAssignFeeToClass(data),
    onSuccess: (res) => {
      toast.success(res.data?.message || "Fee assigned");
      queryClient.invalidateQueries({ queryKey: ["class-fee-summary"] });
      queryClient.invalidateQueries({ queryKey: ["due-list"] });
      queryClient.invalidateQueries({ queryKey: ["fee-dashboard"] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Bulk assign failed"),
  });
};

export const useCollectPayment = (studentFeeId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => collectPayment(studentFeeId, data),
    onSuccess: () => {
      toast.success("Payment collected");
      queryClient.invalidateQueries({ queryKey: ["student-fee", studentFeeId] });
      queryClient.invalidateQueries({ queryKey: ["payment-history", studentFeeId] });
      queryClient.invalidateQueries({ queryKey: ["class-fee-summary"] });
      queryClient.invalidateQueries({ queryKey: ["due-list"] });
      queryClient.invalidateQueries({ queryKey: ["fee-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["all-payments"] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Payment failed"),
  });
};

export const useUpdateFeeComponent = (studentFeeId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => updateStudentFeeComponent(studentFeeId, data),
    onSuccess: () => {
      toast.success("Fee component updated");
      queryClient.invalidateQueries({ queryKey: ["student-fee", studentFeeId] });
      queryClient.invalidateQueries({ queryKey: ["fee-dashboard"] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Update failed"),
  });
};

export const useAddCustomComponent = (studentFeeId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => addCustomFeeComponent(studentFeeId, data),
    onSuccess: () => {
      toast.success("Custom fee component added");
      queryClient.invalidateQueries({ queryKey: ["student-fee", studentFeeId] });
      queryClient.invalidateQueries({ queryKey: ["fee-dashboard"] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Could not add component"),
  });
};

export const useRemoveCustomComponent = (studentFeeId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (componentId) => removeCustomFeeComponent(studentFeeId, componentId),
    onSuccess: () => {
      toast.success("Component removed");
      queryClient.invalidateQueries({ queryKey: ["student-fee", studentFeeId] });
      queryClient.invalidateQueries({ queryKey: ["fee-dashboard"] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Could not remove component"),
  });
};

export const useClassFeeSummary = (params) =>
  useQuery({
    queryKey: ["class-fee-summary", params],
    queryFn: async () => (await getClassFeeSummary(params)).data?.data,
    enabled: Boolean(params?.classId && params?.academicYear),
  });

export const useDueList = (params) =>
  useQuery({
    queryKey: ["due-list", params],
    queryFn: async () => (await getDueList(params)).data?.data,
  });

export const useFeeDashboard = (params) =>
  useQuery({
    queryKey: ["fee-dashboard", params],
    queryFn: async () => (await getFeeDashboard(params)).data?.data,
    placeholderData: (prev) => prev, // avoid chart flicker while filters change
  });
