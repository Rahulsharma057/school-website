"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  Box,
  Chip,
  CircularProgress,
  Container,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PushPinIcon from "@mui/icons-material/PushPin";

import { getPublicAnnouncementsList } from "@/services/announcementService";

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "general", label: "General" },
  { value: "notice", label: "Notice" },
  { value: "event", label: "Event" },
  { value: "urgent", label: "Urgent" },
];

const TYPE_STYLES = {
  general: { bg: "#f4f4f5", color: "#3f3f46", label: "General" },
  notice: { bg: "#dbeafe", color: "#1d4ed8", label: "Notice" },
  event: { bg: "#dcfce7", color: "#15803d", label: "Event" },
  urgent: { bg: "#fee2e2", color: "#b91c1c", label: "Urgent" },
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

export default function NoticesPage() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);

    getPublicAnnouncementsList({ page, limit: 12, type: type || undefined })
      .then((res) => {
        if (!cancelled) setData(res.data?.data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, type]);

  const items = data?.data || [];
  const totalPages = data?.totalPages || 1;

  return (
    <Box sx={{ background: "#fafafa", minHeight: "100vh" }}>
      <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" mb={3} flexWrap="wrap" rowGap={2}>
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ color: "#18181b", fontSize: { xs: 24, md: 30 } }}>
              Notices & Announcements
            </Typography>
            <Typography sx={{ color: "#71717a", mt: 0.5 }}>
              Stay updated with the latest news, notices, and events.
            </Typography>
          </Box>

          <TextField
            select
            size="small"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            sx={{ width: 180, bgcolor: "#fff" }}
          >
            {TYPE_OPTIONS.map((t) => (
              <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
            ))}
          </TextField>
        </Stack>

        {loading ? (
          <Stack alignItems="center" py={8}>
            <CircularProgress size={28} sx={{ color: "#18181b" }} />
          </Stack>
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, border: "1px dashed #d4d4d8", borderRadius: 2 }}>
            <Typography sx={{ color: "#a1a1aa" }}>No notices found.</Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {items.map((item) => {
              const style = TYPE_STYLES[item.type] || TYPE_STYLES.general;
              return (
                <Box
                  key={item._id}
                  component={Link}
                  href={
                    item.link?.type === "external"
                      ? item.link.url
                      : item.link?.type === "internal"
                        ? item.link.url
                        : `/announcements/${item.slug}`
                  }
                  target={item.link?.type === "external" ? "_blank" : undefined}
                  rel={item.link?.type === "external" ? "noreferrer" : undefined}
                  sx={{
                    display: "block",
                    textDecoration: "none",
                    p: 2.5,
                    bgcolor: "#fff",
                    border: "1px solid #e4e4e7",
                    borderRadius: 2,
                    transition: "border-color 0.2s",
                    "&:hover": { borderColor: "#18181b" },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} mb={0.7} flexWrap="wrap" rowGap={0.5}>
                    {item.pinned && <PushPinIcon sx={{ fontSize: 15, color: "#C9A96E" }} />}
                    <Chip label={style.label} size="small" sx={{ fontWeight: 600, fontSize: 11, bgcolor: style.bg, color: style.color }} />
                    <Typography sx={{ fontSize: 12.5, color: "#a1a1aa" }}>{formatDate(item.startDate)}</Typography>
                  </Stack>

                  <Typography sx={{ fontSize: 15.5, fontWeight: 600, color: "#18181b" }}>
                    {item.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 13.5,
                      color: "#71717a",
                      mt: 0.4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.tickerText}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        )}

        {totalPages > 1 && (
          <Stack alignItems="center" mt={4}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
              shape="rounded"
              sx={{
                "& .MuiPaginationItem-root.Mui-selected": { bgcolor: "#18181b", color: "#fff" },
              }}
            />
          </Stack>
        )}
      </Container>
    </Box>
  );
}