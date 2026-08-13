"use client";

import { useSearchParams } from "next/navigation";
import { Box } from "@mui/material";

import AssignFeeForm from "@/components/admin/fees/AssignFeeForm";

export default function AssignFeePage() {
  const searchParams = useSearchParams();
  const structureId = searchParams.get("structureId");

  return (
    <Box>
      <AssignFeeForm defaultStructureId={structureId} />
    </Box>
  );
}