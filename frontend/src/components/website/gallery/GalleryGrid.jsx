"use client";

import { useState } from "react";

import { Box, Button, Container, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { getPublicGallery } from "@/services/galleryService";
import { useGalleryPreview } from "@/hooks/useGalleryImages";

import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import Lightbox from "./Lightbox";

/**
 * Drop this anywhere on the site with just a slug — e.g. on the
 * homepage: <GalleryGrid slug="annual-day-2026" />. Only fetches the
 * gallery's `previewCount` images (small, fast); the "View All" button
 * links to the dedicated lazy-loading full gallery page.
 */
export default function GalleryGrid({ slug }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const { data: galleryRes, isLoading: galleryLoading } = useQuery({
    queryKey: ["gallery", "public", slug],
    queryFn: async () => (await getPublicGallery(slug)).data,
    enabled: Boolean(slug),
  });

  const gallery = galleryRes?.data;

  const { data: imagesRes, isLoading: imagesLoading } = useGalleryPreview(
    gallery?._id,
    gallery?.previewCount,
  );

  if (galleryLoading || imagesLoading) return <LoadingSkeleton />;
  if (!gallery) return null;

  const images = imagesRes?.data || [];
  const total = imagesRes?.total || 0;
  const showViewAll = gallery.viewAllEnabled && total > images.length;

  const { type = "grid", columns = 4, gap = 12, rounded = true } = gallery.layout || {};

  return (
    <Box sx={{ py: { xs: 5, md: 8 } }}>
      <Container maxWidth="lg">
        {(gallery.heading || gallery.subheading) && (
          <Box textAlign="center" mb={4}>
            {gallery.heading && (
              <Typography variant="h4" fontWeight={700} sx={{ color: "#18181b" }}>
                {gallery.heading}
              </Typography>
            )}
            {gallery.subheading && (
              <Typography sx={{ color: "#71717a", mt: 1 }}>{gallery.subheading}</Typography>
            )}
          </Box>
        )}

        {images.length === 0 ? (
          <EmptyState title="No photos yet" />
        ) : type === "carousel" ? (
          <Box sx={{ display: "flex", gap: `${gap}px`, overflowX: "auto", pb: 1, scrollSnapType: "x mandatory" }}>
            {images.map((img, i) => (
              <Box
                key={img._id}
                component="img"
                src={img.url}
                alt={img.altText || img.caption || ""}
                loading="lazy"
                onClick={() => setLightboxIndex(i)}
                sx={{
                  width: 280, height: 200, objectFit: "cover", flexShrink: 0, cursor: "pointer",
                  borderRadius: rounded ? 2 : 0, scrollSnapAlign: "start",
                }}
              />
            ))}
          </Box>
        ) : type === "masonry" ? (
          <Box
            sx={{
              columnCount: { xs: 2, sm: Math.min(columns, 3), md: columns },
              columnGap: `${gap}px`,
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
                sx={{
                  width: "100%", display: "block", mb: `${gap}px`, cursor: "pointer",
                  borderRadius: rounded ? 2 : 0,
                  // reserves the right amount of space before the image loads —
                  // avoids layout shift, which is what keeps scroll feeling fast
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

        {showViewAll && (
          <Box textAlign="center" mt={4}>
            <Button
              component={Link}
              href={`/gallery/${gallery.slug}`}
              sx={{
                px: 4, py: 1.2, bgcolor: "#18181b", color: "#fff", borderRadius: "8px",
                fontWeight: 600, textTransform: "none", "&:hover": { bgcolor: "#27272a" },
              }}
            >
              View All Photos
            </Button>
          </Box>
        )}
      </Container>

      <Lightbox images={images} index={lightboxIndex} onClose={() => setLightboxIndex(null)} />
    </Box>
  );
}
