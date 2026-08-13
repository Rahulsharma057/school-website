"use client";

import { useQuery } from "@tanstack/react-query";

import { getAllPayments } from "@/services/feePaymentService";

export const useAllPayments = (params) =>
  useQuery({
    queryKey: ["all-payments", params],
    queryFn: async () => (await getAllPayments(params)).data?.data,
  });