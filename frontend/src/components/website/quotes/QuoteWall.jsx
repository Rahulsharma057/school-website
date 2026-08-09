"use client";

import { useEffect, useRef, useState } from "react";

import { Box, Button, Container, Grid, IconButton, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import usePublicQuotes from "@/hooks/usePublicQuotes";
import usePublicQuoteSection from "@/hooks/usePublicQuoteSection";
import QuoteCard from "./QuoteCard";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";

const WIDTH_MAP = { sm: "sm", md: "md", lg: "lg", xl: "xl", full: false };

const DEFAULT_LAYOUT = {
  columns: 2,
  mobileColumns: 1,
  displayStyle: "grid", // "grid" | "list" | "slider"
  imagePosition: "right",
  cardStyle: "bordered",
  width: "lg",
  primaryColor: "#18181b",
  photoSize: "md",
  photoShape: "round",
  imageDisplay: "avatar", // "avatar" | "full"
  fontSize: "md",
  mobilePhotoPosition: undefined,
};

const DEFAULT_BUTTON = { enabled: false, label: "View All", url: "" };

/**
 * The public "wall of quotes" — a self-contained component, same usage
 * pattern as GalleryGrid/NewsGrid/NoticeBoard elsewhere on this site:
 * drop it anywhere with a `slug` and it fetches and renders itself, no
 * page-level data-fetching required.
 *
 * SLUG MODE (recommended — matches how the rest of the site works):
 *
 *   <QuoteWall slug="directors-says" />
 *
 * If the page isn't published (or the slug doesn't exist), this renders
 * nothing rather than breaking the rest of the page around it.
 *
 * MANUAL MODE — for one-off, hand-placed sections not backed by an
 * admin-built Quote Page:
 *
 *   <QuoteWall
 *     title="What people say"
 *     category="Parent"
 *     pageSize={6}
 *     layout={{ columns: 3, displayStyle: "slider", imageDisplay: "full" }}
 *     button={{ enabled: true, label: "See all stories", url: "/quotes/parent-testimonials" }}
 *   />
 */
export default function QuoteWall({
  slug,
  title = "What people say",
  description,
  layout,
  button,
  category,
  pageSize = 9,
  quotes: curatedQuotes,
}) {
  const sectionQuery = usePublicQuoteSection(slug);
  const section = slug ? sectionQuery.data?.data : null;

  const resolvedTitle = slug ? section?.title : title;
  const resolvedDescription = slug ? section?.description : description;
  const resolvedLayoutInput = slug ? section?.layout : layout;
  const resolvedButtonInput = slug ? section?.button : button;
  const resolvedPageSize = (slug ? section?.pageSize : undefined) ?? pageSize;
  const resolvedCuratedQuotes = slug ? section?.quotes : curatedQuotes;

  const resolvedLayout = { ...DEFAULT_LAYOUT, ...(resolvedLayoutInput || {}) };
  const resolvedButton = { ...DEFAULT_BUTTON, ...(resolvedButtonInput || {}) };
  const isCurated = Array.isArray(resolvedCuratedQuotes);
  const isListStyle = resolvedLayout.displayStyle === "list";
  const isSliderStyle = resolvedLayout.displayStyle === "slider";

  // clamp to safe numbers no matter what came back from the API/props —
  // a bad/missing value here previously could quietly break the slider
  // math (undefined * anything = NaN, and NaN widths render as nothing)
  const columns = [1, 2, 3].includes(Number(resolvedLayout.columns)) ? Number(resolvedLayout.columns) : 2;
  const mobileColumns = [1, 2].includes(Number(resolvedLayout.mobileColumns))
    ? Number(resolvedLayout.mobileColumns)
    : 1;

  const [visibleCount, setVisibleCount] = useState(resolvedPageSize);

  useEffect(() => {
    setVisibleCount(resolvedPageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, resolvedPageSize]);

  const {
    data,
    isLoading: dynamicLoading,
    isError: dynamicError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePublicQuotes({ limit: resolvedPageSize, category, enabled: !isCurated && !slug });

  const dynamicQuotes = data?.pages.flatMap((p) => p.data?.data || []) || [];

  const allQuotes = isCurated ? resolvedCuratedQuotes : dynamicQuotes;
  const visibleQuotes = isCurated ? allQuotes.slice(0, visibleCount) : allQuotes;
  // Sliders navigate by scrolling, not by loading more.
  const canLoadMore = isSliderStyle ? false : isCurated ? visibleCount < allQuotes.length : Boolean(hasNextPage);
  const loadingMore = isCurated ? false : isFetchingNextPage;

  const handleLoadMore = () => {
    if (isCurated) setVisibleCount((v) => v + resolvedPageSize);
    else fetchNextPage();
  };

  const sentinelRef = useRef(null);

  useEffect(() => {
    if (isSliderStyle) return;
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && canLoadMore && !loadingMore) {
          handleLoadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoadMore, loadingMore, isSliderStyle]);

  // ---- slider scrolling ----
  const trackRef = useRef(null);
  const scrollSlider = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: track.clientWidth * 0.9 * direction, behavior: "smooth" });
  };

  if (slug && sectionQuery.isLoading) return <LoadingSkeleton />;
  if (slug && (sectionQuery.isError || !section)) return null;

  if (!slug && !isCurated && dynamicLoading) return <LoadingSkeleton />;
  if (!slug && !isCurated && dynamicError) return <EmptyState title="Unable to load quotes" />;

  const desktopColWidth = columns === 1 ? 12 : columns === 3 ? 4 : 6;
  const mobileColWidth = mobileColumns === 2 ? 6 : 12;

  const sectionSx =
    resolvedLayout.cardStyle === "plain"
      ? { py: { xs: 5, md: 7 } }
      : { py: { xs: 6, md: 9 }, bgcolor: "#fafafa" };

  const isInternalLink = resolvedButton.url?.startsWith("/");

  const renderCard = (quote) => (
    <QuoteCard
      quote={quote}
      variant="horizontal"
      imagePosition={quote.imagePosition || resolvedLayout.imagePosition}
      mobilePhotoPosition={quote.mobilePhotoPosition || resolvedLayout.mobilePhotoPosition}
      photoSize={quote.photoSize || resolvedLayout.photoSize}
      photoShape={quote.photoShape || resolvedLayout.photoShape}
      imageDisplay={quote.imageDisplay || resolvedLayout.imageDisplay}
      fontSize={quote.fontSize || resolvedLayout.fontSize}
      cardStyle={resolvedLayout.cardStyle}
      primaryColor={resolvedLayout.primaryColor}
    />
  );

  return (
    <Box sx={sectionSx}>
      <Container maxWidth={WIDTH_MAP[resolvedLayout.width] ?? "lg"}>
        <Box textAlign="center" mb={{ xs: 4, md: 6 }}>
          <Typography variant="h4" fontWeight={700} sx={{ color: "#18181b", fontSize: { xs: 22, md: 32 } }}>
            {resolvedTitle}
          </Typography>
          {resolvedDescription && (
            <Typography sx={{ color: "#71717a", mt: 1, maxWidth: 560, mx: "auto", fontSize: { xs: 14, md: 16 } }}>
              {resolvedDescription}
            </Typography>
          )}
        </Box>

        {visibleQuotes.length === 0 ? (
          <EmptyState title="No quotes yet" description="Check back soon." />
        ) : isSliderStyle ? (
          // ---- SLIDER: simple horizontal scroll-snap track ----
          // Deliberately NOT using calc()-with-gap-subtraction for item
          // width — that's an easy place for a typo/NaN to silently
          // collapse every card to zero width. Plain percentage widths
          // (100 / columns) are simpler and can't produce NaN as long as
          // `columns`/`mobileColumns` are the clamped numbers above.
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
                px: 0.5,
                mx: -0.5,
                "&::-webkit-scrollbar": { display: "none" },
                scrollbarWidth: "none",
              }}
            >
              {visibleQuotes.map((quote) => (
                <Box
                  key={quote._id}
                  sx={{
                    flex: "0 0 auto",
                    minWidth: 0,
                    width: {
                      xs: mobileColumns === 2 ? "70%" : "88%",
                      sm: `${100 / mobileColumns}%`,
                      md: `${100 / columns}%`,
                    },
                    scrollSnapAlign: "start",
                  }}
                >
                  {renderCard(quote)}
                </Box>
              ))}
            </Box>

            {visibleQuotes.length > columns && (
              <Box
                sx={{
                  display: { xs: "none", sm: "flex" },
                  justifyContent: "center",
                  gap: 1.5,
                  mt: 3,
                }}
              >
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

            {/* mobile hint — arrows are hidden below `sm`, swipe instead */}
            {visibleQuotes.length > 1 && (
              <Typography
                sx={{
                  display: { xs: "block", sm: "none" },
                  textAlign: "center",
                  fontSize: 12,
                  color: "#a1a1aa",
                  mt: 2,
                }}
              >
                Swipe to see more →
              </Typography>
            )}
          </Box>
        ) : (
          // ---- GRID / LIST ----
          <Grid container spacing={{ xs: 2, md: 3 }}>
            {visibleQuotes.map((quote) => (
              <Grid
                item
                xs={isListStyle ? 12 : mobileColWidth}
                md={isListStyle ? 12 : desktopColWidth}
                key={quote._id}
              >
                {renderCard(quote)}
              </Grid>
            ))}
          </Grid>
        )}

        {!isSliderStyle && <Box ref={sentinelRef} sx={{ height: 1 }} />}

        {canLoadMore && (
          <Box textAlign="center" mt={4}>
            <Button
              onClick={handleLoadMore}
              disabled={loadingMore}
              sx={{
                px: 4,
                py: 1.2,
                border: "1px solid #e4e4e7",
                borderRadius: "8px",
                textTransform: "none",
                color: "#3f3f46",
                fontWeight: 600,
              }}
            >
              {loadingMore ? "Loading..." : "Load more"}
            </Button>
          </Box>
        )}

        {resolvedButton.enabled && resolvedButton.url && (
          <Box textAlign="center" mt={canLoadMore ? 2.5 : isSliderStyle ? 4 : 5}>
            <Button
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
      </Container>
    </Box>
  );
}
