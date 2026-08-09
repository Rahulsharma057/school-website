"use client";

import { useQuery } from "@tanstack/react-query";

import { getQuotes } from "@/services/quoteService";

export default function useQuotes(params = {}) {
  return useQuery({
    queryKey: ["quotes", params],
    queryFn: async () => {
      const { data } = await getQuotes(params);
      return data;
    },
    placeholderData: (prev) => prev,
  });
}
