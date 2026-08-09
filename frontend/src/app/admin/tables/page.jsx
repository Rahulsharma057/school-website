"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Box, Button, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import AllTablesTable from "@/components/admin/custom-forms/AllTablesTable";

export default function AllTablesPage() {
  const router = useRouter();

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" rowGap={1.5}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b" }}>
            All Tables
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#71717a" }}>
            Every table generated from a form, in one place. Set who can view each one instantly.
          </Typography>
        </Box>

        <Button
          startIcon={<AddIcon />}
          onClick={() => router.push("/admin/forms")}
          variant="contained"
          disableElevation
          sx={{ bgcolor: "#18181b", textTransform: "none", fontWeight: 600, px: 3, "&:hover": { bgcolor: "#27272a" } }}
        >
          Create New Table (Form)
        </Button>
      </Stack>

      <AllTablesTable onManageFields={(row) => router.push(`/admin/forms?edit=${row._id}`)} />
    </Box>
  );
}