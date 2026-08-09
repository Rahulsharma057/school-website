"use client";

import { Skeleton, Box } from "@mui/material";

export default function HeroSkeleton() {
  return (
    <Box>
      <Skeleton
        variant="rectangular"
        width="100%"
        height={700}
      />
    </Box>
  );
}