"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Box, Chip, Skeleton, Stack, Typography } from "@mui/material";
import CampaignIcon from "@mui/icons-material/Campaign";

import { getPublicTicker } from "@/services/announcementService";

const TYPE_DOT_COLOR = {
  general: "#71717a",
  notice: "#1d4ed8",
  event: "#15803d",
  urgent: "#dc2626",
};

/**
 * Drop this anywhere: <AnnouncementTicker placement="homepage-ticker" />
 *
 * - Lazy: only fetches once the component actually scrolls into view
 *   (IntersectionObserver), so it never slows down initial page load.
 * - Pauses the scroll animation on hover so items are readable.
 * - Each item navigates to the announcement's own detail page, unless
 *   it has a link configured (internal path or external URL).
 */
export default function AnnouncementTicker({ placement, speed = 40 }) {
  const router = useRouter();
  const containerRef = useRef(null);

  const [isVisible, setIsVisible] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // Lazy-load trigger: don't fetch anything until this ticker is
  // actually near the viewport.
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

  // Nothing to show and we're done loading — render nothing at all so
  // an empty ticker never reserves visual space.
  if (loaded && items.length === 0) return null;

  // Duplicate the list once so the CSS marquee can loop seamlessly.
  const loopItems = items.length ? [...items, ...items] : [];

  return (
    <Box
      ref={containerRef}
      sx={{
        width: "100%",
        overflow: "hidden",
        bgcolor: "#18181b",
     //   borderRadius: 1.5,
        py: 1,
      }}
    >
      {!isVisible || loading ? (
        <Box sx={{ px: 2 }}>
          <Skeleton variant="text" width="60%" height={24} sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
        </Box>
      ) : (
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2 }}>
          <CampaignIcon sx={{ color: "#C9A96E", fontSize: 20, flexShrink: 0 }} />

          <Box
            sx={{
              overflow: "hidden",
              flex: 1,
              maskImage: "linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent)",
            }}
          >
            <Stack
              direction="row"
              spacing={5}
              sx={{
                width: "max-content",
                animation: `ticker-scroll ${Math.max(items.length * speed, 15)}s linear infinite`,
                "&:hover": { animationPlayState: "paused" },
                "@keyframes ticker-scroll": {
                  "0%": { transform: "translateX(0)" },
                  "100%": { transform: "translateX(-50%)" },
                },
              }}
            >
              {loopItems.map((item, index) => (
                <Stack
                  key={`${item._id}-${index}`}
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  onClick={() => handleClick(item)}
                  sx={{ cursor: "pointer", "&:hover": { opacity: 0.85 } }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      bgcolor: TYPE_DOT_COLOR[item.type] || TYPE_DOT_COLOR.general,
                      flexShrink: 0,
                    }}
                  />
                  <Typography sx={{ color: "#fff", fontSize: 13.5, whiteSpace: "nowrap" }}>
                    {item.tickerText}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Stack>
      )}
    </Box>
  );
}