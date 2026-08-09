"use client";

import { useEffect, useState } from "react";

import { Box, Chip, IconButton, InputAdornment, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SearchIcon from "@mui/icons-material/Search";
import PushPinIcon from "@mui/icons-material/PushPin";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getAnnouncements, deleteAnnouncement } from "@/services/announcementService";

import ConfirmationDialog from "@/components/common/ConfirmationDialog";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

const TYPE_STYLES = {
  general: { bg: "#f4f4f5", color: "#3f3f46", label: "General" },
  notice: { bg: "#dbeafe", color: "#1d4ed8", label: "Notice" },
  event: { bg: "#dcfce7", color: "#15803d", label: "Event" },
  urgent: { bg: "#fee2e2", color: "#b91c1c", label: "Urgent" },
};

const isExpired = (row) => row.endDate && new Date(row.endDate) < new Date();
const isUpcoming = (row) => new Date(row.startDate) > new Date();

export default function AnnouncementsTable({ onEdit }) {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(0); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["announcements", { page: page + 1, limit: pageSize, search }],
    queryFn: async () => {
      const res = await getAnnouncements({ page: page + 1, limit: pageSize, search });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      toast.success("Announcement deleted");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setDeleteId(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  const copyLink = (slug) => {
    navigator.clipboard.writeText(`${SITE_URL}/announcements/${slug}`);
    toast.success("Link copied");
  };

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <EmptyState title="Unable to load announcements" />;

  const rows = data?.data?.data?.map((a) => ({ ...a, id: a._id })) || [];

  const columns = [
    {
      field: "title",
      headerName: "Announcement",
      flex: 1,
      minWidth: 260,
      renderCell: ({ row }) => (
        <Stack spacing={0} justifyContent="center" sx={{ height: "100%" }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            {row.pinned && <PushPinIcon sx={{ fontSize: 14, color: "#18181b" }} />}
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#18181b" }}>{row.title}</Typography>
          </Stack>
          <Typography sx={{ fontSize: 12, color: "#a1a1aa" }} noWrap>
            {row.tickerText}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "type",
      headerName: "Type",
      width: 110,
      renderCell: ({ value }) => {
        const s = TYPE_STYLES[value] || TYPE_STYLES.general;
        return <Chip label={s.label} size="small" sx={{ fontWeight: 600, fontSize: 11, bgcolor: s.bg, color: s.color }} />;
      },
    },
    {
      field: "schedule",
      headerName: "Schedule",
      width: 150,
      sortable: false,
      renderCell: ({ row }) => {
        if (!row.status) return <Chip label="Disabled" size="small" sx={{ fontSize: 11, bgcolor: "#f4f4f5", color: "#71717a" }} />;
        if (isUpcoming(row)) return <Chip label="Upcoming" size="small" sx={{ fontSize: 11, bgcolor: "#fef3c7", color: "#b45309" }} />;
        if (isExpired(row)) return <Chip label="Expired" size="small" sx={{ fontSize: 11, bgcolor: "#f4f4f5", color: "#71717a" }} />;
        return <Chip label="Live" size="small" sx={{ fontWeight: 600, fontSize: 11, bgcolor: "#dcfce7", color: "#15803d" }} />;
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 170,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.3}>
          <Tooltip title="Copy public link">
            <IconButton size="small" onClick={() => copyLink(row.slug)} sx={{ color: "#52525b" }}><ContentCopyIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Open public page">
            <IconButton size="small" href={`/announcements/${row.slug}`} target="_blank" sx={{ color: "#52525b" }}><OpenInNewIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => onEdit(row)} sx={{ color: "#18181b" }}><EditIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => setDeleteId(row.id)} sx={{ color: "#dc2626" }}><DeleteIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
        <TextField
          size="small"
          placeholder="Search announcements..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ width: { xs: "100%", sm: 300 }, "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: "#a1a1aa" }} /></InputAdornment> }}
        />
        <Typography sx={{ fontSize: 13, color: "#71717a" }}>{data?.data?.total ?? 0} announcements</Typography>
      </Stack>

      {rows.length === 0 ? (
        <EmptyState title={search ? "No announcements match your search" : "No announcements yet"} description={search ? "Try a different keyword." : "Create your first announcement above."} />
      ) : (
        <Box sx={{ border: "1px solid #e4e4e7", borderRadius: 2, bgcolor: "#fff", overflow: "hidden" }}>
          <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            paginationMode="server"
            rowCount={data?.data?.total || 0}
            paginationModel={{ page, pageSize }}
            pageSizeOptions={[5, 10, 20, 50]}
            onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }}
            disableRowSelectionOnClick
            getRowHeight={() => 64}
            sx={{
              border: "none",
              "& .MuiDataGrid-columnHeaders": { bgcolor: "#fafafa", borderBottom: "1px solid #e4e4e7" },
              "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700, fontSize: 12.5, color: "#3f3f46", textTransform: "uppercase", letterSpacing: "0.03em" },
              "& .MuiDataGrid-cell": { borderBottom: "1px solid #f4f4f5" },
              "& .MuiDataGrid-row:hover": { bgcolor: "#fafafa" },
              "& .MuiDataGrid-footerContainer": { borderTop: "1px solid #e4e4e7" },
            }}
          />
        </Box>
      )}

      <ConfirmationDialog
        open={Boolean(deleteId)}
        title="Delete Announcement"
        message="This will permanently delete the announcement and its attachment (if any)."
        loading={deleteMutation.isPending}
        confirmText="Delete"
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
      />
    </>
  );
}