"use client";

import { useState } from "react";

import { Box, Container, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

import { getPublicGallery } from "@/services/galleryService";
import { useGalleryImagesInfinite } from "@/hooks/useGalleryImages";
import useInViewFetchMore from "@/hooks/useInViewFetchMore";

import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import Lightbox from "./Lightbox";

/**
 * The dedicated "View All" page for a gallery. Loads images page by
 * page (backend-paginated) as the user scrolls near the bottom — the
 * browser never has to hold the whole gallery in memory at once, which
 * is what keeps this fast even for a few hundred photos.
 *
 * @param {string} slug
 * @param {object} [initialGallery] - server-fetched gallery (from the page's
 *   own metadata fetch) to avoid a duplicate client-side request on load.
 */
export default function GalleryFullView({ slug, initialGallery }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const { data: galleryRes, isLoading: galleryLoading } = useQuery({
    queryKey: ["gallery", "public", slug],
    queryFn: async () => (await getPublicGallery(slug)).data,
    enabled: Boolean(slug),
    initialData: initialGallery ? { data: initialGallery } : undefined,
  });

  const gallery = galleryRes?.data;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGalleryImagesInfinite(gallery?._id, 24);

  const sentinelRef = useInViewFetchMore({
    onIntersect: () => {
      if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
    enabled: hasNextPage,
  });

  if (galleryLoading || isLoading) return <LoadingSkeleton />;
  if (!gallery) return <EmptyState title="Gallery not found" />;

  const images = data?.pages?.flatMap((p) => p.data) || [];
  const total = data?.pages?.[0]?.total ?? 0;
  const { type = "grid", columns = 4, gap = 12, rounded = true } = gallery.layout || {};

  return (
    <Box sx={{ py: { xs: 5, md: 8 } }}>
      <Container maxWidth="lg">
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" fontWeight={700} sx={{ color: "#18181b" }}>
            {gallery.heading || gallery.title}
          </Typography>
          {gallery.subheading && <Typography sx={{ color: "#71717a", mt: 1 }}>{gallery.subheading}</Typography>}
          <Typography sx={{ color: "#a1a1aa", mt: 0.5, fontSize: 13 }}>{total} photos</Typography>
        </Box>

        {images.length === 0 ? (
          <EmptyState title="No photos yet" />
        ) : type === "masonry" ? (
          <Box sx={{ columnCount: { xs: 2, sm: Math.min(columns, 3), md: columns }, columnGap: `${gap}px` }}>
            {images.map((img, i) => (
              <Box
                key={img._id}
                component="img"
                src={img.url}
                alt={img.altText || img.caption || ""}
                loading="lazy"
                onClick={() => setLightboxIndex(i)}
                sx={{
                  width: "100%", display: "block", mb: `${gap}px`, cursor: "pointer",
                  borderRadius: rounded ? 2 : 0,
                  aspectRatio: img.width && img.height ? `${img.width} / ${img.height}` : "auto",
                }}
              />
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: `repeat(${Math.min(columns, 3)}, 1fr)`,
                md: `repeat(${columns}, 1fr)`,
              },
              gap: `${gap}px`,
            }}
          >
            {images.map((img, i) => (
              <Box
                key={img._id}
                component="img"
                src={img.url}
                alt={img.altText || img.caption || ""}
                loading="lazy"
                onClick={() => setLightboxIndex(i)}
                sx={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", cursor: "pointer", borderRadius: rounded ? 2 : 0 }}
              />
            ))}
          </Box>
        )}

        {/* Sentinel — when this scrolls into view, the next page loads automatically */}
        <Box ref={sentinelRef} sx={{ height: 1 }} />

        {isFetchingNextPage && (
          <Typography textAlign="center" sx={{ color: "#a1a1aa", fontSize: 13, mt: 3 }}>
            Loading more...
          </Typography>
        )}
      </Container>

      <Lightbox images={images} index={lightboxIndex} onClose={() => setLightboxIndex(null)} />
    </Box>
  );
}
