"use client";

import { useQuery } from "@tanstack/react-query";

import { getSections } from "@/services/quoteSectionService";

export default function useQuoteSections(params = {}) {
  return useQuery({
    queryKey: ["quote-sections", params],
    queryFn: async () => {
      const { data } = await getSections(params);
      return data;
    },
    placeholderData: (prev) => prev,
  });
}
