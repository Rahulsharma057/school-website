"use client";

import { Box, Typography } from "@mui/material";
import FeeDashboard from "@/components/admin/fees/FeeDashboard";

export default function FeeDashboardPage() {
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b", mb: 0.5 }}>Fee Dashboard</Typography>
      <Typography sx={{ fontSize: 13, color: "#71717a", mb: 3 }}>
        Collection overview — class-wise and month-wise, with filters.
      </Typography>
      <FeeDashboard />
    </Box>
  );
}
