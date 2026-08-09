"use client";

import { useEffect, useState } from "react";

import { Box, Chip, IconButton, InputAdornment, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SearchIcon from "@mui/icons-material/Search";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getContactPages, deleteContactPage } from "@/services/contactPageService";

import ConfirmationDialog from "@/components/common/ConfirmationDialog";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

export default function ContactPagesTable({ onEdit }) {
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
    queryKey: ["contact-pages", { page: page + 1, limit: pageSize, search }],
    queryFn: async () => {
      const res = await getContactPages({ page: page + 1, limit: pageSize, search });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContactPage,
    onSuccess: () => {
      toast.success("Contact page deleted");
      queryClient.invalidateQueries({ queryKey: ["contact-pages"] });
      setDeleteId(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  const copyLink = (slug) => {
    navigator.clipboard.writeText(`${SITE_URL}/contact/${slug}`);
    toast.success("Link copied");
  };

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <EmptyState title="Unable to load contact pages" />;

  const rows = data?.data?.data?.map((c) => ({ ...c, id: c._id })) || [];

  const columns = [
    {
      field: "title",
      headerName: "Contact Page",
      flex: 1,
      minWidth: 220,
      renderCell: ({ row }) => (
        <Stack spacing={0} justifyContent="center" sx={{ height: "100%" }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#18181b" }}>{row.title}</Typography>
          <Typography sx={{ fontSize: 12, color: "#a1a1aa" }}>/contact/{row.slug}</Typography>
        </Stack>
      ),
    },
    {
      field: "contactFormSlug",
      headerName: "Form",
      width: 160,
      renderCell: ({ value }) => (
        <Typography sx={{ fontSize: 12.5, color: value ? "#52525b" : "#d4d4d8" }}>{value || "None"}</Typography>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: ({ value }) => (
        <Chip label={value ? "Active" : "Inactive"} size="small" sx={{ fontWeight: 600, fontSize: 12, bgcolor: value ? "#dcfce7" : "#f4f4f5", color: value ? "#15803d" : "#71717a" }} />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 170,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.3}>
          <Tooltip title="Copy link">
            <IconButton size="small" onClick={() => copyLink(row.slug)} sx={{ color: "#52525b" }}><ContentCopyIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Open page">
            <IconButton size="small" href={`/contact/${row.slug}`} target="_blank" sx={{ color: "#52525b" }}><OpenInNewIcon fontSize="small" /></IconButton>
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
          placeholder="Search contact pages..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ width: { xs: "100%", sm: 300 }, "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: "#a1a1aa" }} /></InputAdornment> }}
        />
        <Typography sx={{ fontSize: 13, color: "#71717a" }}>{data?.data?.total ?? 0} pages</Typography>
      </Stack>

      {rows.length === 0 ? (
        <EmptyState title={search ? "No pages match your search" : "No contact pages yet"} description={search ? "Try a different keyword." : "Create your first contact page above."} />
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
        title="Delete Contact Page"
        message="This will delete the page. The linked form (if any) and its submissions are not affected."
        loading={deleteMutation.isPending}
        confirmText="Delete"
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
      />
    </>
  );
}