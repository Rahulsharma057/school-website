"use client";

import { useState } from "react";
import { Box, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DownloadIcon from "@mui/icons-material/Download";

import { useAllPayments } from "@/hooks/fees/useAllPayments";
import { downloadReceiptPdf } from "@/utils/receiptPdf";

import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";

export default function PaymentsTable() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading, isError } = useAllPayments({ from: from || undefined, to: to || undefined });

  const rows = (data?.payments || []).map((p) => ({ ...p, id: p._id }));

  const handleDownload = (row) => {
    downloadReceiptPdf(row, {
      studentName: row.student?.user?.name,
      rollNumber: row.student?.rollNumber,
    });
  };

  const columns = [
    { field: "receiptNumber", headerName: "Receipt #", width: 150 },
    {
      field: "student",
      headerName: "Student",
      width: 170,
      renderCell: ({ value }) => value?.user?.name || "—",
    },
    { field: "componentName", headerName: "Component", width: 150 },
    { field: "amountPaid", headerName: "Amount", width: 100, renderCell: ({ value }) => `₹${value.toLocaleString("en-IN")}` },
    { field: "paymentMode", headerName: "Mode", width: 110 },
    { field: "collectedBy", headerName: "Collected By", width: 150, renderCell: ({ value }) => value?.name || "—" },
    { field: "paymentDate", headerName: "Date", width: 140, renderCell: ({ value }) => new Date(value).toLocaleString("en-IN") },
    {
      field: "actions",
      headerName: "Receipt",
      width: 80,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }) => (
        <Tooltip title="Download receipt">
          <IconButton size="small" onClick={() => handleDownload(row)} sx={{ color: "#18181b" }}>
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <Stack direction="row" flexWrap="wrap" gap={2} mb={2} alignItems="center">
        <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }} value={from} onChange={(e) => setFrom(e.target.value)} />
        <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }} value={to} onChange={(e) => setTo(e.target.value)} />
        {data && <Typography sx={{ fontSize: 13, color: "#71717a" }}>{data.count} payments · ₹{data.totalCollected.toLocaleString("en-IN")} collected</Typography>}
      </Stack>

      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <EmptyState title="Unable to load payments" />
      ) : rows.length === 0 ? (
        <EmptyState title="No payments in this range" />
      ) : (
        <Box sx={{ border: "1px solid #e4e4e7", borderRadius: 2, bgcolor: "#fff", overflow: "hidden" }}>
          <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            disableRowSelectionOnClick
            getRowHeight={() => 56}
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
