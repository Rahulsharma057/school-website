"use client";

import { useState } from "react";
import { useInView } from "react-intersection-observer";

import { Box, Card, CardContent, Chip, Skeleton, Typography, Button } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * A single news card. Deliberately dumb/presentational — NewsGrid owns
 * data-fetching and pagination, this just renders one item and reports
 * clicks upward via onView.
 *
 * Image loading is two-layered:
 *  1. `useInView` (IntersectionObserver) delays even *starting* the
 *     image request until the card is near the viewport — the browser
 *     never issues the request for cards far below the fold.
 *  2. `loading="lazy"` on the <img> itself as a defense-in-depth second
 *     layer for browsers/cases where our own observer margin is generous.
 */
export default function NewsCard({ news, onView }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: "200px 0px", // start loading a bit before it's actually visible
  });

  return (
    <Card
      ref={ref}
      elevation={0}
      sx={{
        border: "1px solid #e4e4e7",
        borderRadius: 3,
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.15s ease, transform 0.15s ease",
        "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.08)", transform: "translateY(-2px)" },
      }}
    >
      <Box sx={{ position: "relative", width: "100%", aspectRatio: "16 / 10", bgcolor: "#f4f4f5" }}>
        {(!inView || !imgLoaded) && (
          <Skeleton
            variant="rectangular"
            animation="wave"
            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          />
        )}

        {inView && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={news.coverImage?.url}
            alt={news.coverImage?.alt || news.title}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: imgLoaded ? 1 : 0,
              transition: "opacity 0.25s ease",
            }}
          />
        )}

        {news.isFeatured && (
          <Chip
            label="Featured"
            size="small"
            sx={{
              position: "absolute",
              top: 10,
              left: 10,
              fontWeight: 700,
              fontSize: 11,
              bgcolor: "#18181b",
              color: "#fff",
            }}
          />
        )}
      </Box>

      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2.25 }}>
        {news.heading && (
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#71717a", mb: 0.5, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            {news.heading}
          </Typography>
        )}

        <Typography
          sx={{
            fontSize: 16,
            fontWeight: 700,
            color: "#18181b",
            mb: 0.75,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {news.title}
        </Typography>

        {news.excerpt && (
          <Typography
            sx={{
              fontSize: 13.5,
              color: "#52525b",
              mb: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              flex: 1,
            }}
          >
            {news.excerpt}
          </Typography>
        )}

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: "auto", pt: 1 }}>
          <Typography sx={{ fontSize: 12, color: "#a1a1aa" }}>{formatDate(news.publishedAt || news.createdAt)}</Typography>

          <Button
            size="small"
            startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
            onClick={() => onView?.(news)}
            sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, color: "#18181b" }}
          >
            View
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
