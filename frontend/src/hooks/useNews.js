"use client";

import { useQuery } from "@tanstack/react-query";

import { getPublicNews, getPublicNewsBySlug } from "@/services/newsService";

/**
 * Powers the embeddable NewsGrid widget. `params` typically looks like
 * { limit, page, tag, category, featured }.
 */
export function useNewsList(params = {}) {
  return useQuery({
    queryKey: ["news", "public", params],
    queryFn: async () => {
      const { data } = await getPublicNews(params);
      return data;
    },
    placeholderData: (prev) => prev, // smooth page-to-page transitions, same idea as keepPreviousData
  });
}

/** Powers the full article / detail view, fetched by slug. */
export function useNewsDetail(slug) {
  return useQuery({
    queryKey: ["news", "detail", slug],
    queryFn: async () => {
      const { data } = await getPublicNewsBySlug(slug);
      return data;
    },
    enabled: Boolean(slug),
  });
}
