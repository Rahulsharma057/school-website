"use client";

import { useQuery } from "@tanstack/react-query";

import { getMyClassFeeSummary } from "@/services/studentFeeService";

export const useMyClassFeeSummary = (academicYear) =>
  useQuery({
    queryKey: ["my-class-fee-summary", academicYear],
    queryFn: async () => (await getMyClassFeeSummary({ academicYear })).data?.data,
    enabled: Boolean(academicYear),
  });