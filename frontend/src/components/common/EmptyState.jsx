"use client";

import { Box, Typography } from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";

export default function EmptyState({ title = "No Data Found" }) {
  return (
    <Box py={8} display="flex" flexDirection="column" alignItems="center">
      <InboxIcon
        sx={{
          fontSize: 70,
          color: "#bbb",
        }}
      />

      <Typography mt={2} color="text.secondary">
        {title}
      </Typography>
    </Box>
  );
}
