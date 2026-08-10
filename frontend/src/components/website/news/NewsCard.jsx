"use client";

import { useState } from "react";
import { useInView } from "react-intersection-observer";

import { Box, Card, CardContent, Chip, IconButton, Skeleton, Stack, Tooltip, Typography, Button } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ShareIcon from "@mui/icons-material/Share";
import CheckIcon from "@mui/icons-material/Check";

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
 * `orientation="vertical"` (default) — image on top, classic card, used
 *   in grid/slider layouts.
 * `orientation="horizontal"` — image on the side, used in "list" layout
 *   where each card spans the full container width.
 *
 * Image loading is two-layered:
 *  1. `useInView` (IntersectionObserver) delays even *starting* the
 *     image request until the card is near the viewport — the browser
 *     never issues the request for cards far below the fold.
 *  2. `loading="lazy"` on the <img> itself as a defense-in-depth second
 *     layer for browsers/cases where our own observer margin is generous.
 *
 * Share uses the native Web Share API on devices/browsers that support
 * it (mobile mostly), and falls back to copying the article link to the
 * clipboard everywhere else — either way it needs no external service.
 */
export default function NewsCard({ news, onView, orientation = "vertical" }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: "200px 0px",
  });

  const isHorizontal = orientation === "horizontal";

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/news/${news.slug}` : `/news/${news.slug}`;

  const handleShare = async (e) => {
    e.stopPropagation();

    if (navigator.share) {
      try {
        await navigator.share({ title: news.title, text: news.excerpt || news.title, url: shareUrl });
      } catch {
        // user cancelled the native share sheet — not an error
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1800);
    } catch {
      // clipboard blocked (rare, e.g. insecure context) — silently no-op
      // rather than showing a broken/alarming error for a non-critical action
    }
  };

  const imageBox = (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: isHorizontal ? { xs: "16 / 10", sm: "4 / 3" } : "16 / 10",
        bgcolor: "#f4f4f5",
        flexShrink: 0,
      }}
    >
      {(!inView || !imgLoaded) && (
        <Skeleton variant="rectangular" animation="wave" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
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
          sx={{ position: "absolute", top: 10, left: 10, fontWeight: 700, fontSize: 11, bgcolor: "#18181b", color: "#fff" }}
        />
      )}
    </Box>
  );

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid #e4e4e7",
        borderRadius: 3,
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: { xs: "column", sm: isHorizontal ? "row" : "column" },
        transition: "box-shadow 0.15s ease, transform 0.15s ease",
        "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.08)", transform: "translateY(-2px)" },
      }}
    >
      <Box ref={ref} sx={{ width: { xs: "100%", sm: isHorizontal ? 260 : "100%" }, flexShrink: 0 }}>
        {imageBox}
      </Box>

      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", p: { xs: 2, md: 2.25 }, minWidth: 0 }}>
        {news.heading && (
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#71717a", mb: 0.5, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            {news.heading}
          </Typography>
        )}

        <Typography
          sx={{
            fontSize: { xs: 15, md: 16 },
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
              WebkitLineClamp: isHorizontal ? 3 : 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              flex: 1,
            }}
          >
            {news.excerpt}
          </Typography>
        )}

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: "auto", pt: 1, gap: 1 }}>
          <Typography sx={{ fontSize: 12, color: "#a1a1aa", flexShrink: 0 }}>
            {formatDate(news.publishedAt || news.createdAt)}
          </Typography>

          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title={justCopied ? "Link copied!" : "Share"}>
              <IconButton size="small" onClick={handleShare} sx={{ color: justCopied ? "#15803d" : "#71717a" }}>
                {justCopied ? <CheckIcon sx={{ fontSize: 17 }} /> : <ShareIcon sx={{ fontSize: 17 }} />}
              </IconButton>
            </Tooltip>

            <Button
              size="small"
              startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
              onClick={() => onView?.(news)}
              sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, color: "#18181b" }}
            >
              View
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
