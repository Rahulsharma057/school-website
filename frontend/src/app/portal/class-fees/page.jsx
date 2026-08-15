"use client";

import { useState } from "react";

import { Box, Chip, Stack, TextField, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import { useMyClassFeeSummary } from "@/hooks/fees/useMyClassFeeSummary";

import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";

const STATUS_STYLES = {
  PAID: { bg: "#dcfce7", color: "#15803d" },
  PARTIAL: { bg: "#fef3c7", color: "#b45309" },
  PENDING: { bg: "#f4f4f5", color: "#71717a" },
};

export default function TeacherClassFeesPage() {
  const [academicYear, setAcademicYear] = useState("");

  const { data, isLoading, isError } = useMyClassFeeSummary(academicYear || undefined);

  const rows = (data || []).map((r) => ({ ...r, id: r._id }));

  const columns = [
    {
      field: "student",
      headerName: "Student",
      flex: 1,
      minWidth: 200,
      renderCell: ({ row }) => (
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{row.student?.user?.name}</Typography>
          <Typography sx={{ fontSize: 12, color: "#a1a1aa" }}>Roll #{row.student?.rollNumber}</Typography>
        </Box>
      ),
    },
    { field: "totalAmount", headerName: "Total", width: 120, renderCell: ({ value }) => `₹${value.toLocaleString("en-IN")}` },
    { field: "totalPaid", headerName: "Paid", width: 120, renderCell: ({ value }) => `₹${value.toLocaleString("en-IN")}` },
    {
      field: "totalDue",
      headerName: "Due",
      width: 130,
      renderCell: ({ value }) => (
        <Typography sx={{ fontWeight: 700, color: value > 0 ? "#dc2626" : "#15803d" }}>₹{value.toLocaleString("en-IN")}</Typography>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: ({ value }) => (
        <Chip label={value} size="small" sx={{ fontWeight: 600, bgcolor: STATUS_STYLES[value]?.bg, color: STATUS_STYLES[value]?.color }} />
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b", mb: 0.5 }}>
        Class Fee Status
      </Typography>
      <Typography sx={{ fontSize: 13, color: "#71717a", mb: 3 }}>
        Read-only view of your class's fee status. Contact the office for payment collection.
      </Typography>

      <Stack direction="row" mb={3}>
        <TextField
          size="small"
          label="Academic Year"
          placeholder="2026-27"
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
          sx={{ width: 180 }}
        />
      </Stack>

      {!academicYear ? (
        <EmptyState title="Enter an academic year" description="e.g. 2026-27, to see your class's fee status." />
      ) : isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <EmptyState title="Unable to load fee data" description="You may not have a class assigned yet." />
      ) : rows.length === 0 ? (
        <EmptyState title="No fee records found" description="No fees have been assigned to your class for this year yet." />
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
    </Box>
  );
}