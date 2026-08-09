"use client";

import { useEffect, useState } from "react";

import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
  InputAdornment,
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "react-toastify";

import useCustomPages from "@/hooks/useCustomPages";

import { deletePage, updatePageStatus, duplicatePage, bulkPageAction } from "@/services/customPageService";

import ConfirmationDialog from "@/components/common/ConfirmationDialog";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import StatusSwitch from "@/components/common/StatusSwitch";

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const BULK_OPTIONS = [
  { value: "publish", label: "Publish" },
  { value: "unpublish", label: "Unpublish" },
  { value: "delete", label: "Delete Permanently" },
];

export default function CustomPageTable({ onEdit }) {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  // FIX: NEW — bulk selection. MUI X Data Grid v8+ needs the
  // { type, ids: Set } shape, not a plain array (see rowSelectionModel below).
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkActionValue, setBulkActionValue] = useState("");
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError } = useCustomPages({
    page: page + 1,
    limit: pageSize,
    search,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["custom-pages"] });

  const deleteMutation = useMutation({
    mutationFn: deletePage,
    onSuccess: () => {
      toast.success("Page deleted successfully");
      invalidate();
      setDeleteId(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updatePageStatus(id, status),
    onSuccess: () => {
      toast.success("Status Updated");
      invalidate();
    },
    onError: () => toast.error("Status update failed"),
  });

  // FIX: NEW
  const duplicateMutation = useMutation({
    mutationFn: duplicatePage,
    onSuccess: () => {
      toast.success("Page duplicated — saved as a draft, review before publishing");
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Duplicate failed"),
  });

  // FIX: NEW
  const bulkMutation = useMutation({
    mutationFn: bulkPageAction,
    onSuccess: (_res, variables) => {
      toast.success(`Bulk ${variables.action} applied`);
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Bulk action failed"),
  });

  if (isLoading) return <LoadingSkeleton />;

  if (isError) return <EmptyState title="Unable to load pages" />;

  const rows = data?.data?.data?.map((item) => ({ ...item, id: item._id })) || [];

  const columns = [
    {
      field: "image",
      headerName: "Image",
      width: 90,
      sortable: false,
      renderCell: ({ row }) => (
        <Avatar
          src={row.coverImage?.url || ""}
          variant="rounded"
          imgProps={{ loading: "lazy" }}
          sx={{ width: 56, height: 42, border: "1px solid #e4e4e7" }}
        />
      ),
    },
    {
      field: "title",
      headerName: "Title",
      flex: 1,
      minWidth: 220,
      renderCell: ({ row }) => (
        <Stack spacing={0} justifyContent="center" sx={{ height: "100%" }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#18181b" }}>{row.title}</Typography>
          <Typography sx={{ fontSize: 12, color: "#a1a1aa" }}>
            /{row.slug}
            {row.sections?.length > 0 && ` · ${row.sections.length} sections`}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "route",
      headerName: "Route",
      width: 160,
      renderCell: ({ value }) => <Typography sx={{ fontSize: 13, color: "#52525b" }}>{value}</Typography>,
    },
    {
      field: "pageType",
      headerName: "Type",
      width: 130,
      renderCell: ({ value }) => (
        <Chip label={value || "General"} size="small" sx={{ fontWeight: 600, fontSize: 12, bgcolor: "#f4f4f5", color: "#3f3f46", border: "1px solid #e4e4e7" }} />
      ),
    },
    {
      field: "navbar",
      headerName: "Navbar",
      width: 110,
      renderCell: ({ row }) => (
        <Chip label={row.showInNavbar ? "Visible" : "Hidden"} size="small" sx={{ fontWeight: 600, fontSize: 12, bgcolor: row.showInNavbar ? "#dcfce7" : "#f4f4f5", color: row.showInNavbar ? "#15803d" : "#71717a" }} />
      ),
    },
    { field: "navbarOrder", headerName: "Nav Order", width: 100 },
    {
      field: "footer",
      headerName: "Footer",
      width: 110,
      renderCell: ({ row }) => (
        <Chip label={row.showInFooter ? "Visible" : "Hidden"} size="small" sx={{ fontWeight: 600, fontSize: 12, bgcolor: row.showInFooter ? "#dcfce7" : "#f4f4f5", color: row.showInFooter ? "#15803d" : "#71717a" }} />
      ),
    },
    { field: "footerOrder", headerName: "Footer Order", width: 110 },
    {
      field: "featured",
      headerName: "Featured",
      width: 100,
      renderCell: ({ row }) => (
        <Chip label={row.featured ? "Yes" : "No"} size="small" sx={{ fontWeight: 600, fontSize: 12, bgcolor: row.featured ? "#fef3c7" : "#f4f4f5", color: row.featured ? "#b45309" : "#71717a" }} />
      ),
    },
    { field: "order", headerName: "Order", width: 80 },
    {
      field: "updatedAt",
      headerName: "Last Updated",
      width: 130,
      renderCell: ({ value }) => <Typography sx={{ fontSize: 13, color: "#71717a" }}>{formatDate(value)}</Typography>,
    },
    {
      field: "status",
      headerName: "Status",
      width: 110,
      renderCell: ({ row }) => (
        <StatusSwitch checked={row.status} onChange={(value) => statusMutation.mutate({ id: row.id, status: value })} />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View">
            <IconButton size="small" href={row.route} target="_blank" sx={{ color: "#52525b" }}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Duplicate">
            <IconButton size="small" onClick={() => duplicateMutation.mutate(row.id)} disabled={duplicateMutation.isPending} sx={{ color: "#3f3f46" }}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => onEdit(row)} sx={{ color: "#18181b" }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => setDeleteId(row.id)} sx={{ color: "#dc2626" }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5} flexWrap="wrap" rowGap={1.5}>
        <TextField
          size="small"
          placeholder="Search pages..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ width: { xs: "100%", sm: 300 }, "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: "#a1a1aa" }} /></InputAdornment> }}
        />

        <Typography sx={{ fontSize: 13, color: "#71717a" }}>{data?.data?.total ?? 0} pages</Typography>
      </Stack>

      {/* FIX: NEW — bulk action bar, shown only once something is selected */}
      {selectedIds.size > 0 && (
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2, p: 1.5, border: "1px solid #e4e4e7", borderRadius: 2, bgcolor: "#fafafa" }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{selectedIds.size} selected</Typography>

          <TextField
            select
            size="small"
            label="Bulk action"
            value={bulkActionValue}
            onChange={(e) => setBulkActionValue(e.target.value)}
            sx={{ width: 220, bgcolor: "#fff" }}
          >
            {BULK_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </TextField>

          <Button
            size="small"
            variant="contained"
            disableElevation
            disabled={!bulkActionValue || bulkMutation.isPending}
            onClick={() => setBulkConfirmOpen(true)}
            sx={{ textTransform: "none", bgcolor: "#18181b", "&:hover": { bgcolor: "#27272a" } }}
          >
            Apply
          </Button>

          <Button size="small" onClick={() => setSelectedIds(new Set())} sx={{ textTransform: "none", color: "#71717a" }}>
            Clear
          </Button>
        </Stack>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title={search ? "No pages match your search" : "No pages yet"}
          description={search ? "Try a different keyword." : "Create your first custom page using the Add Page button."}
        />
      ) : (
        <Box sx={{ border: "1px solid #e4e4e7", borderRadius: 2, bgcolor: "#fff", overflow: "hidden" }}>
          <DataGrid
            autoHeight
            checkboxSelection
            rows={rows}
            columns={columns}
            paginationMode="server"
            rowCount={data?.data?.total || 0}
            paginationModel={{ page, pageSize }}
            pageSizeOptions={[5, 10, 20, 50]}
            onPaginationModelChange={(model) => {
              setPage(model.page);
              setPageSize(model.pageSize);
            }}
            rowSelectionModel={{ type: "include", ids: selectedIds }}
            onRowSelectionModelChange={(newModel) => setSelectedIds(newModel.ids)}
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
        title="Delete Page"
        message="Are you sure you want to delete this page?"
        loading={deleteMutation.isPending}
        confirmText="Delete"
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
      />

      <ConfirmationDialog
        open={bulkConfirmOpen}
        title="Apply Bulk Action"
        message={`This will apply "${BULK_OPTIONS.find((o) => o.value === bulkActionValue)?.label || bulkActionValue}" to ${selectedIds.size} page${selectedIds.size === 1 ? "" : "s"}.${bulkActionValue === "delete" ? " This cannot be undone." : ""}`}
        loading={bulkMutation.isPending}
        confirmText="Apply"
        onClose={() => setBulkConfirmOpen(false)}
        onConfirm={() =>
          bulkMutation.mutate(
            { ids: Array.from(selectedIds), action: bulkActionValue },
            {
              onSuccess: () => {
                setSelectedIds(new Set());
                setBulkActionValue("");
                setBulkConfirmOpen(false);
              },
            },
          )
        }
      />
    </>
  );
}
