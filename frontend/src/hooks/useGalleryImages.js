"use client";

import { useInfiniteQuery, useQuery, keepPreviousData } from "@tanstack/react-query";

import { getGalleryImages } from "@/services/galleryImageService";

const PAGE_SIZE = 20;

/**
 * Powers the "View All" page — real backend pagination, fetched page by
 * page as the user scrolls (see useInViewFetchMore below). This is what
 * keeps a 500-photo gallery fast: the browser never holds more than a
 * few pages of images in the DOM/query cache at once.
 */
export function useGalleryImagesInfinite(galleryId, pageSize = PAGE_SIZE) {
  return useInfiniteQuery({
    queryKey: ["gallery-images", "infinite", galleryId, pageSize],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await getGalleryImages(galleryId, { page: pageParam, limit: pageSize });
      return data.data; // { data, total, page, limit, totalPages }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: Boolean(galleryId),
  });
}

/**
 * Powers the embedded preview widget — just the gallery's first
 * `previewCount` images, one small request, no infinite scroll needed.
 */
export function useGalleryPreview(galleryId, previewCount = 8) {
  return useQuery({
    queryKey: ["gallery-images", "preview", galleryId, previewCount],
    queryFn: async () => {
      const { data } = await getGalleryImages(galleryId, { page: 1, limit: previewCount });
      return data.data;
    },
    enabled: Boolean(galleryId),
    placeholderData: keepPreviousData,
  });
}
