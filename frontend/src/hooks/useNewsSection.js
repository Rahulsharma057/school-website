"use client";

import { useQuery } from "@tanstack/react-query";

import { getSection } from "@/services/newsSectionService";

export default function useNewsSection(id) {
  return useQuery({
    queryKey: ["news-sections", id],
    queryFn: async () => {
      const { data } = await getSection(id);
      return data;
    },
    enabled: Boolean(id),
  });
}
