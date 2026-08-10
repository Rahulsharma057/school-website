"use client";

import { useState } from "react";

import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ShareIcon from "@mui/icons-material/Share";
import CheckIcon from "@mui/icons-material/Check";

import { useNewsDetail } from "@/hooks/useNews";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Full-article view, opened from a NewsCard's "View" button. Fetches by
 * slug only while open (`enabled: Boolean(slug)` inside useNewsDetail),
 * so nothing loads until the user actually clicks View.
 */
export default function NewsDetailDialog({ slug, open, onClose }) {
  const { data, isLoading } = useNewsDetail(slug);
  const news = data?.data;

  const [justCopied, setJustCopied] = useState(false);

  const handleShare = async () => {
    const url =
      typeof window !== "undefined" && slug ? `${window.location.origin}/news/${slug}` : "";

    if (navigator.share) {
      try {
        await navigator.share({ title: news?.title, text: news?.excerpt || news?.title, url });
      } catch {
        // user cancelled the native share sheet — not an error
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1800);
    } catch {
      // clipboard blocked — silently no-op
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="body">
      <Stack direction="row" spacing={1} sx={{ position: "absolute", top: 12, right: 12, zIndex: 1 }}>
        <Tooltip title={justCopied ? "Link copied!" : "Share"}>
          <IconButton onClick={handleShare} sx={{ bgcolor: "rgba(255,255,255,0.9)", color: justCopied ? "#15803d" : "inherit" }}>
            {justCopied ? <CheckIcon fontSize="small" /> : <ShareIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <IconButton onClick={onClose} sx={{ bgcolor: "rgba(255,255,255,0.9)" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      {isLoading || !news ? (
        <Box sx={{ p: 4 }}>
          <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2, mb: 3 }} />
          <Skeleton width="60%" height={36} sx={{ mb: 1 }} />
          <Skeleton width="30%" height={20} sx={{ mb: 3 }} />
          <Skeleton height={16} />
          <Skeleton height={16} />
          <Skeleton width="80%" height={16} />
        </Box>
      ) : (
        <>
          {news.coverImage?.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={news.coverImage.url}
              alt={news.coverImage.alt || news.title}
              style={{ width: "100%", maxHeight: 380, objectFit: "cover" }}
            />
          )}

          <DialogTitle sx={{ pt: 3 }}>
            <Stack spacing={1}>
              {news.heading && (
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  {news.heading}
                </Typography>
              )}
              <Typography sx={{ fontSize: { xs: 20, md: 24 }, fontWeight: 800, color: "#18181b", lineHeight: 1.25 }}>
                {news.title}
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                <Typography sx={{ fontSize: 13, color: "#a1a1aa" }}>
                  {formatDate(news.publishedAt || news.createdAt)}
                </Typography>
                {news.author && (
                  <Typography sx={{ fontSize: 13, color: "#a1a1aa" }}>· By {news.author}</Typography>
                )}
                {news.category && (
                  <Chip label={news.category} size="small" sx={{ fontSize: 11, height: 22 }} />
                )}
              </Stack>
            </Stack>
          </DialogTitle>

          <DialogContent>
            <Typography
              component="div"
              sx={{ fontSize: { xs: 14, md: 15 }, color: "#27272a", lineHeight: 1.75, whiteSpace: "pre-wrap" }}
            >
              {news.content}
            </Typography>

            {news.gallery?.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#71717a", mb: 1.5 }}>
                  GALLERY
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 1.5 }}>
                  {news.gallery.map((img) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={img.public_id}
                      src={img.url}
                      alt={img.alt || news.title}
                      loading="lazy"
                      style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 8 }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {news.tags?.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1} sx={{ mt: 3 }}>
                {news.tags.map((tag) => (
                  <Chip key={tag} label={`#${tag}`} size="small" variant="outlined" sx={{ fontSize: 11.5 }} />
                ))}
              </Stack>
            )}
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
