"use client";

import { useQuery } from "@tanstack/react-query";

import { getSection } from "@/services/quoteSectionService";

/**
 * Fetches the FULL detail of one quote section/page, including its
 * `quotes` array populated with real quote content (author, text,
 * photo). The admin list endpoint (getSections / useQuoteSections)
 * deliberately strips `quotes` to keep the table light — this hook is
 * what the edit form uses instead so it always has the real, populated
 * quote list to work with, no matter what the table passed it.
 */
export default function useQuoteSection(id) {
  return useQuery({
    queryKey: ["quote-sections", id],
    queryFn: async () => {
      const { data } = await getSection(id);
      return data;
    },
    enabled: Boolean(id),
  });
}
