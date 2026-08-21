"use client";

import { useEffect, useState } from "react";

import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import SearchIcon from "@mui/icons-material/Search";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getSyllabi, deleteSyllabus } from "@/services/syllabusService";
import { useClasses } from "@/hooks/useClasses"; // FIX: use the app's actual classes hook

import ConfirmationDialog from "@/components/common/ConfirmationDialog";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

export default function SyllabusTable({ onEdit }) {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // FIX: useClasses() already returns the normalized array directly (res.data.data)
  const { data: classes = [] } = useClasses();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["syllabi", { page: page + 1, limit: pageSize, search, classId }],

    queryFn: async () => {
      const res = await getSyllabi({
        page: page + 1,
        limit: pageSize,
        search,
        ...(classId ? { classId } : {}),
      });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSyllabus,

    onSuccess: () => {
      toast.success("Syllabus deleted");
      queryClient.invalidateQueries({ queryKey: ["syllabi"] });
      setDeleteId(null);
    },

    onError: (err) => {
      toast.error(err?.response?.data?.message || "Delete failed");
    },
  });

  const copyLink = async (slug) => {
    try {
      await navigator.clipboard.writeText(`${SITE_URL}/syllabus/${slug}`);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  // FIX: className + section, not `name` (Class model has no `name` field)
  const getClassLabel = (c) => `${c.className}${c.section ? ` - ${c.section}` : ""}`;

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <EmptyState title="Unable to load syllabi" />;

  const rows = data?.data?.data?.map((item) => ({ ...item, id: item._id })) || [];

  const columns = [
    {
      field: "title",
      headerName: "Syllabus",
      flex: 1,
      minWidth: 250,
      renderCell: ({ row }) => (
        <Stack justifyContent="center" sx={{ height: "100%" }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#18181b" }}>{row.title}</Typography>
          <Typography sx={{ fontSize: 12, color: "#a1a1aa" }}>
            {row.className} · /syllabus/{row.slug}
          </Typography>
        </Stack>
      ),
    },
    { field: "schoolName", headerName: "School", width: 190 },
    {
      field: "className",
      headerName: "Class",
      width: 140,
      renderCell: ({ value }) => (
        <Chip label={value} size="small" sx={{ bgcolor: "#f3e8ff", color: "#7e22ce", fontWeight: 700 }} />
      ),
    },
    { field: "academicYear", headerName: "Year", width: 110 },
    {
      field: "status",
      headerName: "Status",
      width: 110,
      renderCell: ({ value }) => (
        <Chip
          label={value ? "Active" : "Inactive"}
          size="small"
          sx={{ fontWeight: 700, bgcolor: value ? "#dcfce7" : "#f4f4f5", color: value ? "#15803d" : "#71717a" }}
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 220,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.3}>
          <Tooltip title="Copy public link">
            <IconButton size="small" onClick={() => copyLink(row.slug)}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Open public page">
            <IconButton size="small" href={`/syllabus/${row.slug}`} target="_blank">
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Download PDF">
            <IconButton size="small" href={row.pdf?.url || undefined} target="_blank" disabled={!row.pdf?.url}>
              <PictureAsPdfIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => onEdit(row)}>
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
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" mb={2}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField
            size="small"
            placeholder="Search syllabi..."
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

          <TextField
            select
            size="small"
            label="Class"
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All Classes</MenuItem>
            {classes.map((c) => (
              <MenuItem key={c._id} value={c._id}>
                {getClassLabel(c)}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Typography sx={{ fontSize: 13, color: "#71717a", alignSelf: { xs: "flex-start", md: "center" } }}>
          {data?.data?.total ?? 0} syllabi
        </Typography>
      </Stack>

      {rows.length === 0 ? (
        <EmptyState
          title={search || classId ? "No syllabi found" : "No syllabi yet"}
          description={search || classId ? "Try another search or class." : "Create your first syllabus above."}
        />
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
            onPaginationModelChange={(model) => {
              setPage(model.page);
              setPageSize(model.pageSize);
            }}
            disableRowSelectionOnClick
            getRowHeight={() => 64}
            sx={{
              border: "none",
              "& .MuiDataGrid-columnHeaders": { bgcolor: "#fafafa", borderBottom: "1px solid #e4e4e7" },
              "& .MuiDataGrid-columnHeaderTitle": {
                fontWeight: 700,
                fontSize: 12.5,
                color: "#3f3f46",
                textTransform: "uppercase",
              },
              "& .MuiDataGrid-cell": { borderBottom: "1px solid #f4f4f5" },
              "& .MuiDataGrid-row:hover": { bgcolor: "#fafafa" },
            }}
          />
        </Box>
      )}

      <ConfirmationDialog
        open={Boolean(deleteId)}
        title="Delete Syllabus"
        message="This will permanently delete the syllabus and its generated PDF."
        loading={deleteMutation.isPending}
        confirmText="Delete"
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
      />
    </>
  );
}