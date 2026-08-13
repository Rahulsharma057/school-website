"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";

import AssignFeeForm from "@/components/admin/fees/AssignFeeForm";

function AssignFeeContent() {
  const searchParams = useSearchParams();
  const structureId = searchParams.get("structureId");

  return (
    <Box>
      <AssignFeeForm defaultStructureId={structureId} />
    </Box>
  );
}

export default function AssignFeePage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: "300px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <AssignFeeContent />
    </Suspense>
  );
}