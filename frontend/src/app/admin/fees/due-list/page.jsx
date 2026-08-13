"use client";

import { Box, Typography } from "@mui/material";
import DueListTable from "@/components/admin/fees/DueListTable";

export default function DueListPage() {
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b", mb: 0.5 }}>Due List</Typography>
      <Typography sx={{ fontSize: 13, color: "#71717a", mb: 3 }}>Students with pending fee dues — click a row to open their record.</Typography>
      <DueListTable />
    </Box>
  );
}