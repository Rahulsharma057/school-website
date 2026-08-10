"use client";

import { useQuery } from "@tanstack/react-query";

import { getPublicSection } from "@/services/newsSectionService";

/**
 * Public, client-side fetch of one News Section by its route slug —
 * title, layout, button, and its already-matching articles for page 1.
 * Lets <NewsGrid slug="..." /> be self-contained, the same way
 * QuoteWall/GalleryGrid/NoticeBoard fetch their own data from a slug.
 */
export default function usePublicNewsSection(slug, page = 1) {
  return useQuery({
    queryKey: ["news-sections", "public", slug, page],
    queryFn: async () => {
      const { data } = await getPublicSection(slug, { page });
      return data;
    },
    enabled: Boolean(slug),
    placeholderData: (prev) => prev,
  });
}
