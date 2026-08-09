"use client";

import { Box, Typography } from "@mui/material";

export default function PageHeader({ title, subtitle, action }) {
  return (
    <Box
      mb={3}
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      flexWrap="wrap"
      gap={2}
    >
      <Box>
        <Typography variant="h4" fontWeight={700}>
          {title}
        </Typography>

        {subtitle && <Typography color="text.secondary">{subtitle}</Typography>}
      </Box>

      {action}
    </Box>
  );
}
