"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Box, Button, Skeleton, Stack, Typography } from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";
import PushPinIcon from "@mui/icons-material/PushPin";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "next/link";

import { getPublicTicker } from "@/services/announcementService";

const TYPE_COLOR = {
  general: "#71717a",
  notice: "#1d4ed8",
  event: "#15803d",
  urgent: "#dc2626",
};

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

/**
 * Vertical notice-board widget — the "box that keeps sliding, 2 lines
 * at a time" pattern seen on most school/college sites. Drop anywhere:
 *
 *   <NoticeBoard placement="notice-board" />
 *
 * - Lazy: fetches only once scrolled into view.
 * - Each visible slot shows one item (title + short excerpt = ~2 lines),
 *   auto-advancing on an interval, pausing on hover.
 * - "View All" links to /notices for the full paginated list.
 */
export default function NoticeBoard({
  placement = "notice-board",
  title = "Notices & Updates",
  height = 220,
  intervalMs = 3500,
}) {
  const router = useRouter();
  const containerRef = useRef(null);

  const [isVisible, setIsVisible] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || loaded) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await getPublicTicker(placement);
        if (!cancelled) setItems(res.data?.data || []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isVisible, loaded, placement]);

  // Auto-advance the visible item — pauses while the user is hovering.
  useEffect(() => {
    if (!items.length || paused) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [items.length, paused, intervalMs]);

  const handleClick = (item) => {
    if (item.link?.type === "external" && item.link.url) {
      window.open(item.link.url, "_blank", "noopener,noreferrer");
      return;
    }
    if (item.link?.type === "internal" && item.link.url) {
      router.push(item.link.url);
      return;
    }
    router.push(`/announcements/${item.slug}`);
  };

  if (loaded && items.length === 0) return null;

  // How many rows fit in the given height — each row ~ (2-line text +
  // padding), computed loosely so the box never overflows visually.
  const rowHeight = 62;
  const visibleCount = Math.max(1, Math.floor(height / rowHeight));

  // Build a rolling window of `visibleCount` items starting at
  // activeIndex, so the box always looks "full" while quietly rotating.
  const visibleItems = items.length
    ? Array.from({ length: Math.min(visibleCount, items.length) }, (_, i) => items[(activeIndex + i) % items.length])
    : [];

  return (
    <Box
      ref={containerRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      sx={{
        width: "100%",
        border: "1px solid #e4e4e7",
        borderRadius: 2,
        bgcolor: "#fff",
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, py: 1.3, bgcolor: "#18181b" }}
      >
        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 14.5 }}>{title}</Typography>
        <Button
          component={Link}
          href="/notices"
          endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
          size="small"
          sx={{ color: "#C9A96E", textTransform: "none", fontSize: 12.5, minWidth: 0, p: 0.3 }}
        >
          View All
        </Button>
      </Stack>

      <Box sx={{ height, overflow: "hidden", position: "relative" }}>
        {!isVisible || loading ? (
          <Stack spacing={1.5} sx={{ p: 2 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="text" height={22} />
            ))}
          </Stack>
        ) : (
          <Stack sx={{ height: "100%" }}>
            {visibleItems.map((item, i) => (
              <Stack
                key={`${item._id}-${activeIndex}-${i}`}
                onClick={() => handleClick(item)}
                sx={{
                  height: rowHeight,
                  px: 2,
                  py: 1,
                  borderBottom: i !== visibleItems.length - 1 ? "1px solid #f4f4f5" : "none",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                  "&:hover": { bgcolor: "#fafafa" },
                  justifyContent: "center",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={0.7} mb={0.3}>
                  {item.pinned && <PushPinIcon sx={{ fontSize: 12, color: "#C9A96E" }} />}
                  <CircleIcon sx={{ fontSize: 6, color: TYPE_COLOR[item.type] || TYPE_COLOR.general }} />
                  <Typography sx={{ fontSize: 11, color: "#a1a1aa" }}>
                    {formatDate(item.startDate)}
                  </Typography>
                </Stack>

                <Typography
                  sx={{
                    fontSize: 13.5,
                    color: "#18181b",
                    fontWeight: 500,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    lineHeight: 1.35,
                  }}
                >
                  {item.tickerText}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}