"use client";

import { useQuery } from "@tanstack/react-query";

import { getPublicSection } from "@/services/quoteSectionService";

/**
 * Public, client-side fetch of one Quote Page by its route slug —
 * title, layout, and its already-resolved quote list. This is what lets
 * <QuoteWall slug="..." /> be a fully self-contained component, the same
 * way GalleryGrid/NewsGrid/NoticeBoard take a slug/placement prop and
 * fetch their own data — no page has to pre-fetch anything for it.
 */
export default function usePublicQuoteSection(slug) {
  return useQuery({
    queryKey: ["quote-sections", "public", slug],
    queryFn: async () => {
      const { data } = await getPublicSection(slug);
      return data;
    },
    enabled: Boolean(slug),
  });
}
