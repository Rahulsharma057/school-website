"use client";

import { useEffect, useState } from "react";

import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SearchIcon from "@mui/icons-material/Search";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import useQuoteSections from "@/hooks/useQuoteSections";
import { deleteSection } from "@/services/quoteSectionService";

import ConfirmationDialog from "@/components/common/ConfirmationDialog";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

export default function QuoteSectionsTable({ onEdit }) {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError } = useQuoteSections({ search });

  const deleteMutation = useMutation({
    mutationFn: deleteSection,
    onSuccess: () => {
      toast.success("Page deleted");
      queryClient.invalidateQueries({ queryKey: ["quote-sections"] });
      setDeleteId(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Delete failed"),
  });

  const copyLink = (slug) => {
    navigator.clipboard.writeText(`${SITE_URL}/quotes/${slug}`);
    toast.success("Link copied");
  };

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <EmptyState title="Unable to load quote pages" />;

  const sections = data?.data || [];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
        <TextField
          size="small"
          placeholder="Search pages..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ width: { xs: "100%", sm: 300 }, "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: "#a1a1aa" }} />
              </InputAdornment>
            ),
          }}
        />
        <Typography sx={{ fontSize: 13, color: "#71717a" }}>{sections.length} pages</Typography>
      </Stack>

      {sections.length === 0 ? (
        <EmptyState
          title={search ? "No pages match your search" : "No quote pages yet"}
          description={
            search
              ? "Try a different keyword."
              : "Create one above to give a group of quotes its own titled, styled page and route."
          }
        />
      ) : (
        <Stack spacing={1.25}>
          {sections.map((section) => (
            <Box
              key={section._id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                bgcolor: "#fff",
                border: "1px solid #e4e4e7",
                borderRadius: 2,
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#18181b" }} noWrap>
                    {section.title}
                  </Typography>
                  <Chip
                    label={section.status ? "Published" : "Draft"}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      fontSize: 11,
                      bgcolor: section.status ? "#dcfce7" : "#f4f4f5",
                      color: section.status ? "#15803d" : "#71717a",
                    }}
                  />
                </Stack>
                <Typography sx={{ fontSize: 12.5, color: "#a1a1aa", fontFamily: "monospace" }}>
                  /quotes/{section.slug}
                </Typography>
              </Box>

              <Tooltip title="Copy link">
                <IconButton size="small" onClick={() => copyLink(section.slug)} sx={{ color: "#52525b" }}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Open page">
                <IconButton
                  size="small"
                  href={`/quotes/${section.slug}`}
                  target="_blank"
                  sx={{ color: "#52525b" }}
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => onEdit(section)} sx={{ color: "#18181b" }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" onClick={() => setDeleteId(section._id)} sx={{ color: "#dc2626" }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ))}
        </Stack>
      )}

      <ConfirmationDialog
        open={Boolean(deleteId)}
        title="Delete Quote Page"
        message="This deletes the page and its route — the underlying quotes are not affected."
        loading={deleteMutation.isPending}
        confirmText="Delete"
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
      />
    </Box>
  );
}
