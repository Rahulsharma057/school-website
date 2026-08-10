"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Box, Chip, Container, IconButton, Skeleton, Stack, Tooltip, Typography, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShareIcon from "@mui/icons-material/Share";
import CheckIcon from "@mui/icons-material/Check";

import { useNewsDetail } from "@/hooks/useNews";
import EmptyState from "@/components/common/EmptyState";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Dedicated, shareable page for a single article — same content as
// NewsDetailDialog shows in a popup, but as a real page with its own URL
// (so it can be linked/shared/indexed), reached from the /news listing
// page's cards (NewsGrid with detailMode="link").
export default function NewsDetailPage() {
  const { slug } = useParams();
  const router = useRouter();

  const { data, isLoading, isError } = useNewsDetail(slug);
  const news = data?.data;

  const [justCopied, setJustCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";

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
      // clipboard blocked — silently no-op rather than an alarming error
      // for a non-critical action
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Skeleton variant="rectangular" height={360} sx={{ borderRadius: 2, mb: 3 }} />
        <Skeleton width="60%" height={40} sx={{ mb: 1 }} />
        <Skeleton width="30%" height={20} sx={{ mb: 3 }} />
        <Skeleton height={18} />
        <Skeleton height={18} />
        <Skeleton width="80%" height={18} />
      </Container>
    );
  }

  if (isError || !news) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <EmptyState title="Article not found" description="This article may have been removed or unpublished." />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/news")}
          sx={{ textTransform: "none", color: "#71717a", pl: 0 }}
        >
          Back to News
        </Button>

        <Tooltip title={justCopied ? "Link copied!" : "Share this article"}>
          <IconButton
            onClick={handleShare}
            sx={{ border: "1px solid #e4e4e7", color: justCopied ? "#15803d" : "#3f3f46" }}
          >
            {justCopied ? <CheckIcon fontSize="small" /> : <ShareIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Stack>

      {news.coverImage?.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={news.coverImage.url}
          alt={news.coverImage.alt || news.title}
          style={{ width: "100%", maxHeight: 420, objectFit: "cover", borderRadius: 12 }}
        />
      )}

      <Stack spacing={1} sx={{ mt: 3, mb: 3 }}>
        {news.heading && (
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.03em" }}>
            {news.heading}
          </Typography>
        )}
        <Typography component="h1" sx={{ fontSize: { xs: 24, md: 32 }, fontWeight: 800, color: "#18181b", lineHeight: 1.2 }}>
          {news.title}
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <Typography sx={{ fontSize: 13.5, color: "#a1a1aa" }}>
            {formatDate(news.publishedAt || news.createdAt)}
          </Typography>
          {news.author && <Typography sx={{ fontSize: 13.5, color: "#a1a1aa" }}>· By {news.author}</Typography>}
          {news.category && <Chip label={news.category} size="small" sx={{ fontSize: 11.5, height: 22 }} />}
        </Stack>
      </Stack>

      <Typography
        component="div"
        sx={{ fontSize: { xs: 15, md: 16 }, color: "#27272a", lineHeight: 1.8, whiteSpace: "pre-wrap" }}
      >
        {news.content}
      </Typography>

      {news.gallery?.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#71717a", mb: 1.5 }}>GALLERY</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 1.5 }}>
            {news.gallery.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.public_id}
                src={img.url}
                alt={img.alt || news.title}
                loading="lazy"
                style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: 8 }}
              />
            ))}
          </Box>
        </Box>
      )}

      {news.tags?.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1} sx={{ mt: 4 }}>
          {news.tags.map((tag) => (
            <Chip key={tag} label={`#${tag}`} size="small" variant="outlined" sx={{ fontSize: 12 }} />
          ))}
        </Stack>
      )}

      <Stack direction="row" justifyContent="center" sx={{ mt: 5, display: { xs: "flex", sm: "none" } }}>
        <Button
          startIcon={justCopied ? <CheckIcon /> : <ShareIcon />}
          onClick={handleShare}
          sx={{ textTransform: "none", border: "1px solid #e4e4e7", px: 3, color: justCopied ? "#15803d" : "#3f3f46" }}
        >
          {justCopied ? "Link Copied" : "Share Article"}
        </Button>
      </Stack>
    </Container>
  );
}
