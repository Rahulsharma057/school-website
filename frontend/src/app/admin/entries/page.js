"use client";

import { Box, Typography } from "@mui/material";

import FormEntriesTable from "@/components/admin/custom-forms/FormEntriesTable";

export default function AllSubmissionsPage() {
  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b" }}>
          All Submissions
        </Typography>
        <Typography sx={{ fontSize: 13, color: "#71717a" }}>
          Every entry submitted across every form, in one inbox.
        </Typography>
      </Box>

      <FormEntriesTable />
    </Box>
  );
}