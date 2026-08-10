"use client";

import { useQuery } from "@tanstack/react-query";

import { getSections } from "@/services/newsSectionService";

export default function useNewsSections(params = {}) {
  return useQuery({
    queryKey: ["news-sections", params],
    queryFn: async () => {
      const { data } = await getSections(params);
      return data;
    },
    placeholderData: (prev) => prev,
  });
}
