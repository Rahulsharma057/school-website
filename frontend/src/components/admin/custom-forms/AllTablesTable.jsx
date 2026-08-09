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

import { DataGrid } from "@mui/x-data-grid";

import SearchIcon from "@mui/icons-material/Search";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import TableChartIcon from "@mui/icons-material/TableChart";
import TuneIcon from "@mui/icons-material/Tune";

import { useQuery } from "@tanstack/react-query";

import { getForms } from "@/services/formService";

import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import TableAccessCell from "./TableAccessCell";

/**
 * One page, every table. Every Form produces exactly one admin table
 * (at /admin/tables/:adminTableSlug) — this lists all of them with
 * entry counts and an inline, autosaving access-control dropdown, so an
 * admin managing permissions never has to open each form individually.
 */
export default function AllTablesTable({ onManageFields }) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["forms", { page: page + 1, limit: pageSize, search }],
    queryFn: async () => {
      const res = await getForms({ page: page + 1, limit: pageSize, search });
      return res.data;
    },
  });

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <EmptyState title="Unable to load tables" />;

  const rows = data?.data?.data?.map((f) => ({ ...f, id: f._id })) || [];

  const columns = [
    {
      field: "title",
      headerName: "Table",
      flex: 1,
      minWidth: 220,
      renderCell: ({ row }) => (
        <Stack spacing={0} justifyContent="center" sx={{ height: "100%" }}>
          <Stack direction="row" alignItems="center" spacing={0.7}>
            <TableChartIcon sx={{ fontSize: 15, color: "#a1a1aa" }} />
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#18181b" }}>
              {row.title}
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: 11.5, color: "#a1a1aa", fontFamily: "monospace" }}>
            /admin/tables/{row.adminTableSlug}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "entryCount",
      headerName: "Entries",
      width: 90,
      renderCell: ({ value }) => (
        <Chip
          label={value ?? 0}
          size="small"
          sx={{ fontWeight: 700, fontSize: 12, bgcolor: "#f4f4f5", color: "#3f3f46" }}
        />
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: ({ value }) => (
        <Chip
          label={value ? "Active" : "Inactive"}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: 12,
            bgcolor: value ? "#dcfce7" : "#f4f4f5",
            color: value ? "#15803d" : "#71717a",
          }}
        />
      ),
    },
    {
      field: "access",
      headerName: "Who Can View",
      width: 300,
      sortable: false,
      renderCell: ({ row }) => <TableAccessCell row={row} />,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.3}>
          <Tooltip title="Open table">
            <IconButton size="small" href={`/admin/tables/${row.adminTableSlug}`} sx={{ color: "#52525b" }}>
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit fields & layout">
            <IconButton size="small" onClick={() => onManageFields?.(row)} sx={{ color: "#18181b" }}>
              <TuneIcon fontSize="small" />
            </IconButton>
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
          placeholder="Search tables..."
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
        <Typography sx={{ fontSize: 13, color: "#71717a" }}>
          {data?.data?.total ?? 0} tables
        </Typography>
      </Stack>

      {rows.length === 0 ? (
        <EmptyState
          title={search ? "No tables match your search" : "No tables yet"}
          description={search ? "Try a different keyword." : "Tables are created automatically from Forms."}
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
            getRowHeight={() => 68}
            sx={{
              border: "none",
              "& .MuiDataGrid-columnHeaders": { bgcolor: "#fafafa", borderBottom: "1px solid #e4e4e7" },
              "& .MuiDataGrid-columnHeaderTitle": {
                fontWeight: 700,
                fontSize: 12.5,
                color: "#3f3f46",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              },
              "& .MuiDataGrid-cell": { borderBottom: "1px solid #f4f4f5", display: "flex", alignItems: "center" },
              "& .MuiDataGrid-row:hover": { bgcolor: "#fafafa" },
              "& .MuiDataGrid-footerContainer": { borderTop: "1px solid #e4e4e7" },
            }}
          />
        </Box>
      )}
    </>
  );
}