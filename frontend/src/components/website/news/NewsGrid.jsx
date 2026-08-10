"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Box, Button, Container, IconButton, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { useNewsList } from "@/hooks/useNews";
import usePublicNewsSection from "@/hooks/usePublicNewsSection";
import NewsCard from "./NewsCard";
import NewsDetailDialog from "./NewsDetailDialog";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";

const WIDTH_MAP = { sm: "sm", md: "md", lg: "lg", xl: "xl", full: false };

const DEFAULT_LAYOUT = {
  columns: 3,
  mobileColumns: 1,
  displayStyle: "grid", // "grid" | "list" | "slider"
  cardStyle: "bordered", // reserved for future card-style variants
  width: "lg",
  primaryColor: "#18181b",
};

/**
 * News grid/wall — same self-contained pattern as QuoteWall/GalleryGrid/
 * NoticeBoard: drop it anywhere with a `slug` and it fetches its own
 * config + articles.
 *
 * SLUG MODE (recommended — admin-configured collection):
 *
 *   <NewsGrid slug="sports-news" />
 *
 * Title, description, layout (grid/list/slider, columns, colors), the
 * filter (category/tag/featured), and the "View All" button all come
 * from the News Section built in the admin panel.
 *
 * MANUAL MODE — original prop-driven usage, still fully supported:
 *
 *   <NewsGrid title="Latest News" limit={6} columns={3} paginated detailMode="link" />
 *
 * with new optional `layout` / `button` props layered on top:
 *
 *   <NewsGrid
 *     title="Sports"
 *     category="sports"
 *     limit={6}
 *     layout={{ displayStyle: "slider", columns: 4, mobileColumns: 1 }}
 *     button={{ enabled: true, label: "All Sports News", url: "/news?category=sports" }}
 *   />
 */
export default function NewsGrid({
  slug,
  title = "News & Announcements",
  description,
  limit = 6,
  columns = 3,
  paginated = false,
  viewAllHref = "/news",
  detailMode = "dialog",
  tag,
  category,
  featured,
  layout,
  button,
}) {
  const router = useRouter();

  const sectionQuery = usePublicNewsSection(slug);
  const section = slug ? sectionQuery.data?.data : null;

  const resolvedTitle = slug ? section?.title : title;
  const resolvedDescription = slug ? section?.description : description;
  const resolvedLayout = { ...DEFAULT_LAYOUT, ...((slug ? section?.layout : layout) || {}) };
  const resolvedButton = slug
    ? section?.button
    : button || { enabled: Boolean(!paginated && false), label: "View All News", url: viewAllHref };
  const resolvedLimit = (slug ? section?.pageSize : undefined) ?? limit;

  const isListStyle = resolvedLayout.displayStyle === "list";
  const isSliderStyle = resolvedLayout.displayStyle === "slider";
  const columnsN = [1, 2, 3, 4].includes(Number(resolvedLayout.columns)) ? Number(resolvedLayout.columns) : 3;
  const mobileColumnsN = [1, 2].includes(Number(resolvedLayout.mobileColumns))
    ? Number(resolvedLayout.mobileColumns)
    : 1;

  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState([]);
  const [viewSlug, setViewSlug] = useState(null);

  // ---- manual mode: existing dynamic fetch (tag/category/featured) ----
  const dynamicQuery = useNewsList({
    limit: resolvedLimit,
    page: paginated ? page : 1,
    tag,
    category,
    featured,
    enabled: !slug,
  });

  useEffect(() => {
    setPage(1);
    setAccumulated([]);
  }, [tag, category, featured, resolvedLimit, slug]);

  useEffect(() => {
    if (slug || !paginated || !dynamicQuery.data?.data) return;

    const { data: pageItems, page: resolvedPage } = dynamicQuery.data.data;

    setAccumulated((prev) => {
      if (resolvedPage === 1) return pageItems || [];
      const existingIds = new Set(prev.map((item) => item._id));
      const fresh = (pageItems || []).filter((item) => !existingIds.has(item._id));
      return [...prev, ...fresh];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, paginated, dynamicQuery.data]);

  // ---- slug mode: accumulate pages too, same "Load more" UX ----
  useEffect(() => {
    if (!slug || !sectionQuery.data?.data) return;

    const { articles, page: resolvedPage } = sectionQuery.data.data;

    setAccumulated((prev) => {
      if (resolvedPage === 1) return articles || [];
      const existingIds = new Set(prev.map((item) => item._id));
      const fresh = (articles || []).filter((item) => !existingIds.has(item._id));
      return [...prev, ...fresh];
    });
  }, [slug, sectionQuery.data]);

  const rows = slug ? accumulated : paginated ? accumulated : dynamicQuery.data?.data?.data ?? [];
  const total = slug ? sectionQuery.data?.data?.total ?? 0 : dynamicQuery.data?.data?.total ?? 0;
  const hasMore = isSliderStyle ? false : slug ? rows.length < total : paginated && rows.length < total;
  const isFetchingMore = slug ? sectionQuery.isFetching && page > 1 : dynamicQuery.isFetching;

  const showViewAllButton = resolvedButton?.enabled && resolvedButton?.url;

  const handleView = (item) => {
    if (detailMode === "link") router.push(`/news/${item.slug}`);
    else setViewSlug(item.slug);
  };

  // ---- slider scrolling ----
  const trackRef = useRef(null);
  const scrollSlider = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: track.clientWidth * 0.9 * direction, behavior: "smooth" });
  };

  if (slug && sectionQuery.isLoading) return <LoadingSkeleton />;
  if (slug && (sectionQuery.isError || !section)) return null;

  if (!slug && dynamicQuery.isPending && rows.length === 0) return <LoadingSkeleton />;
  if (!slug && dynamicQuery.isError) {
    return <EmptyState title="Couldn't load news" description="Please try again shortly." />;
  }

  const desktopColWidth = 12 / columnsN;
  const mobileColWidth = 12 / mobileColumnsN;
  const isInternalLink = resolvedButton?.url?.startsWith("/");

  const cardWrapperSx = (widthXs, widthMd) => ({
    gridColumn: { xs: `span ${widthXs}`, md: `span ${widthMd}` },
  });

  const content = (
    <>
      {resolvedTitle && (
        <Box textAlign={slug ? "center" : "left"} mb={{ xs: 3, md: 4 }}>
          <Typography
            variant="h4"
            fontWeight={700}
            color="text.primary"
            sx={{ fontSize: { xs: 22, md: 32 } }}
          >
            {resolvedTitle}
          </Typography>
          {resolvedDescription && (
            <Typography sx={{ color: "#71717a", mt: 1, fontSize: { xs: 14, md: 16 } }}>
              {resolvedDescription}
            </Typography>
          )}
        </Box>
      )}

      {rows.length === 0 ? (
        <EmptyState title="No news yet" description="Check back soon." />
      ) : isSliderStyle ? (
        // ---- SLIDER ----
        <Box sx={{ position: "relative" }}>
          <Box
            ref={trackRef}
            sx={{
              display: "flex",
              gap: { xs: 2, md: 3 },
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              pb: 1,
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
          >
            {rows.map((item) => (
              <Box
                key={item._id}
                sx={{
                  flex: "0 0 auto",
                  minWidth: 0,
                  width: {
                    xs: mobileColumnsN === 2 ? "70%" : "88%",
                    sm: `${100 / mobileColumnsN}%`,
                    md: `${100 / columnsN}%`,
                  },
                  scrollSnapAlign: "start",
                }}
              >
                <NewsCard news={item} onView={handleView} />
              </Box>
            ))}
          </Box>

          {rows.length > columnsN && (
            <Box sx={{ display: { xs: "none", sm: "flex" }, justifyContent: "center", gap: 1.5, mt: 3 }}>
              <IconButton
                onClick={() => scrollSlider(-1)}
                aria-label="Previous"
                sx={{ border: "1px solid #e4e4e7", bgcolor: "#fff", "&:hover": { bgcolor: "#f4f4f5" } }}
              >
                <ChevronLeftIcon />
              </IconButton>
              <IconButton
                onClick={() => scrollSlider(1)}
                aria-label="Next"
                sx={{ border: "1px solid #e4e4e7", bgcolor: "#fff", "&:hover": { bgcolor: "#f4f4f5" } }}
              >
                <ChevronRightIcon />
              </IconButton>
            </Box>
          )}

          {rows.length > 1 && (
            <Typography sx={{ display: { xs: "block", sm: "none" }, textAlign: "center", fontSize: 12, color: "#a1a1aa", mt: 2 }}>
              Swipe to see more →
            </Typography>
          )}
        </Box>
      ) : (
        // ---- GRID / LIST ----
        <Box
          sx={{
            display: "grid",
            gap: { xs: 2, md: 3 },
            gridTemplateColumns: "repeat(12, 1fr)",
            alignItems: "stretch",
          }}
        >
          {rows.map((item) => (
            <Box key={item._id} sx={cardWrapperSx(isListStyle ? 12 : mobileColWidth, isListStyle ? 12 : desktopColWidth)}>
              <NewsCard news={item} onView={handleView} orientation={isListStyle ? "horizontal" : "vertical"} />
            </Box>
          ))}
        </Box>
      )}

      {hasMore && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setPage((p) => p + 1);
              if (slug) sectionQuery.refetch();
            }}
            disabled={isFetchingMore}
            sx={{ textTransform: "none", fontWeight: 600, px: 4 }}
          >
            {isFetchingMore ? "Loading..." : "Load More"}
          </Button>
        </Box>
      )}

      {showViewAllButton && (
        <Box textAlign="center" mt={hasMore ? 2.5 : isSliderStyle ? 4 : 5}>
          <Button
            component={isInternalLink ? Link : "a"}
            href={resolvedButton.url}
            target={isInternalLink ? undefined : "_blank"}
            rel={isInternalLink ? undefined : "noreferrer"}
            endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
            disableElevation
            sx={{
              px: 4,
              py: 1.4,
              bgcolor: resolvedLayout.primaryColor,
              color: "#fff",
              borderRadius: "8px",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { filter: "brightness(0.92)" },
            }}
          >
            {resolvedButton.label}
          </Button>
        </Box>
      )}

      {detailMode === "dialog" && (
        <NewsDetailDialog slug={viewSlug} open={Boolean(viewSlug)} onClose={() => setViewSlug(null)} />
      )}
    </>
  );

  // slug mode renders its own section chrome (background/width), same
  // as QuoteWall — manual mode stays a bare fragment so it drops into
  // whatever Container the caller already has (unchanged behavior).
  if (!slug) return <Box>{content}</Box>;

  return (
    <Box sx={{ py: { xs: 6, md: 9 }, bgcolor: "#fafafa" }}>
      <Container maxWidth={WIDTH_MAP[resolvedLayout.width] ?? "lg"}>{content}</Container>
    </Box>
  );
}
