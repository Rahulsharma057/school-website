"use client";

import { Box, Skeleton } from "@mui/material";

export default function LoadingSkeleton() {
  return (
    <Box>
      <Skeleton height={60} animation="wave" />

      <Skeleton height={300} animation="wave" />
    </Box>
  );
}
