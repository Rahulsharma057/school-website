"use client";

import { useParams } from "next/navigation";
import { Box } from "@mui/material";

import StudentFeeDetail from "@/components/admin/fees/StudentFeeDetail";

export default function StudentFeeDetailPage() {
  const { id } = useParams();
  return (
    <Box>
      <StudentFeeDetail studentFeeId={id} />
    </Box>
  );
}