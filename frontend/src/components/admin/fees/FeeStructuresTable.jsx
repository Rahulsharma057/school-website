"use client";

import { useState } from "react";

import { Box, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

import { useFeeStructures, useDeleteFeeStructure } from "@/hooks/fees/useFeeStructures";

import ConfirmationDialog from "@/components/common/ConfirmationDialog";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";

export default function FeeStructuresTable({ onEdit, onAssign }) {
  const { data, isLoading, isError } = useFeeStructures();
  const deleteMutation = useDeleteFeeStructure();
  const [deleteId, setDeleteId] = useState(null);

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <EmptyState title="Unable to load fee structures" />;

  const rows = (data || []).map((s) => ({ ...s, id: s._id }));

  const columns = [
    {
      field: "class",
      headerName: "Class",
      width: 160,
      renderCell: ({ value }) => <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{value?.className} {value?.section || ""}</Typography>,
    },
    { field: "academicYear", headerName: "Academic Year", width: 140 },
    {
      field: "components",
      headerName: "Components",
      width: 120,
      renderCell: ({ value }) => <Chip label={value?.length || 0} size="small" sx={{ bgcolor: "#f4f4f5", fontWeight: 600 }} />,
    },
    {
      field: "total",
      headerName: "Total Amount",
      width: 150,
      renderCell: ({ row }) => {
        const total = (row.components || []).reduce((sum, c) => sum + (c.amount || 0), 0);
        return <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#15803d" }}>₹{total.toLocaleString("en-IN")}</Typography>;
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: ({ value }) => (
        <Chip label={value ? "Active" : "Inactive"} size="small" sx={{ fontWeight: 600, bgcolor: value ? "#dcfce7" : "#f4f4f5", color: value ? "#15803d" : "#71717a" }} />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.3}>
          <Tooltip title="Assign to class/student">
            <IconButton size="small" onClick={() => onAssign(row)} sx={{ color: "#1d4ed8" }}>
              <PersonAddIcon fontSize="small" />
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
      {rows.length === 0 ? (
        <EmptyState title="No fee structures yet" description="Create one above for a class and academic year." />
      ) : (
        <Box sx={{ border: "1px solid #e4e4e7", borderRadius: 2, bgcolor: "#fff", overflow: "hidden" }}>
          <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            disableRowSelectionOnClick
            getRowHeight={() => 60}
            sx={{
              border: "none",
              "& .MuiDataGrid-columnHeaders": { bgcolor: "#fafafa", borderBottom: "1px solid #e4e4e7" },
              "& .MuiDataGrid-cell": { borderBottom: "1px solid #f4f4f5" },
            }}
          />
        </Box>
      )}

      <ConfirmationDialog
        open={Boolean(deleteId)}
        title="Delete Fee Structure"
        message="This only works if no student has been assigned this structure yet."
        loading={deleteMutation.isPending}
        confirmText="Delete"
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
      />
    </>
  );
}