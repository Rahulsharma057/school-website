"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { getPublicQuotes } from "@/services/quoteService";

/**
 * Powers the "dynamic" mode of the public quotes wall — fetches
 * page-by-page from GET /quotes/public and exposes fetchNextPage/
 * hasNextPage so more quotes load as the visitor scrolls, or via a
 * manual "Load more" button.
 *
 * `enabled` lets a caller mount this hook unconditionally (required by
 * the rules of hooks) while still turning the actual fetching off — used
 * by QuoteWall when it's rendering a curated, pre-resolved quote list
 * instead (an admin-built Quote Page) and doesn't need this query at all.
 */
export default function usePublicQuotes({ limit = 9, category, enabled = true } = {}) {
  return useInfiniteQuery({
    queryKey: ["quotes", "public", { limit, category }],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data } = await getPublicQuotes({ page: pageParam, limit, category });
      return data;
    },
    getNextPageParam: (lastPage) =>
      lastPage?.data?.hasMore ? lastPage.data.page + 1 : undefined,
    enabled,
  });
}
