"use client";

import { Box, Typography } from "@mui/material";
import PaymentsTable from "@/components/admin/fees/PaymentTable";

export default function PaymentsPage() {
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b", mb: 0.5 }}>All Payments</Typography>
      <Typography sx={{ fontSize: 13, color: "#71717a", mb: 3 }}>Audit trail — every payment collected, by whom, when.</Typography>
      <PaymentsTable />
    </Box>
  );
}