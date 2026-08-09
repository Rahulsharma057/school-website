"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Box, Button, Typography } from "@mui/material";

import { useNewsList } from "@/hooks/useNews";
import NewsCard from "./NewsCard";
import NewsDetailDialog from "./NewsDetailDialog";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";

export default function NewsGrid({
  title = "News & Announcements",
  limit = 6,
  columns = 3,
  paginated = false,
  viewAllHref = "/news",
  detailMode = "dialog",
  tag,
  category,
  featured,
}) {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState([]);
  const [viewSlug, setViewSlug] = useState(null);

  const {
    data,
    isPending,
    isFetching,
    isError,
  } = useNewsList({
    limit,
    page: paginated ? page : 1,
    tag,
    category,
    featured,
  });

  useEffect(() => {
    setPage(1);
    setAccumulated([]);
  }, [tag, category, featured, limit]);

  useEffect(() => {
    if (!paginated || !data?.data) return;

    const { data: pageItems, page: resolvedPage } = data.data;

    setAccumulated((prev) => {
      if (resolvedPage === 1) return pageItems || [];

      const existingIds = new Set(prev.map((item) => item._id));

      const fresh = (pageItems || []).filter(
        (item) => !existingIds.has(item._id)
      );

      return [...prev, ...fresh];
    });
  }, [paginated, data]);

  const rows = paginated
    ? accumulated
    : data?.data?.data ?? [];

  const total = data?.data?.total ?? 0;

  const hasMore =
    paginated && rows.length < total;

  const showViewAllButton =
    !paginated && total > limit;

  const handleView = (item) => {
    if (detailMode === "link") {
      router.push(`/news/${item.slug}`);
    } else {
      setViewSlug(item.slug);
    }
  };

  if (isPending && page === 1 && rows.length === 0) {
    return <LoadingSkeleton />;
  }

  if (isError) {
    return (
      <EmptyState
        title="Couldn't load news"
        description="Please try again shortly."
      />
    );
  }

  return (
    <Box>
      {title && (
        <Typography
          variant="h4"
          fontWeight={700}
          mb={4}
          color="text.primary"
        >
          {title}
        </Typography>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title="No news yet"
          description="Check back soon."
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2,1fr)",
              md: `repeat(${columns},1fr)`,
            },
            alignItems: "stretch",
          }}
        >
          {rows.map((item) => (
            <NewsCard
              key={item._id}
              news={item}
              onView={handleView}
            />
          ))}
        </Box>
      )}

      {showViewAllButton && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 4,
          }}
        >
          <Button
            component={Link}
            href={viewAllHref}
            variant="outlined"
            sx={{
              textTransform: "none",
              fontWeight: 600,
              px: 4,
            }}
          >
            View All News
          </Button>
        </Box>
      )}

      {hasMore && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 4,
          }}
        >
          <Button
            variant="outlined"
            onClick={() => setPage((p) => p + 1)}
            disabled={isFetching}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              px: 4,
            }}
          >
            {isFetching ? "Loading..." : "Load More"}
          </Button>
        </Box>
      )}

      {detailMode === "dialog" && (
        <NewsDetailDialog
          slug={viewSlug}
          open={Boolean(viewSlug)}
          onClose={() => setViewSlug(null)}
        />
      )}
    </Box>
  );
}