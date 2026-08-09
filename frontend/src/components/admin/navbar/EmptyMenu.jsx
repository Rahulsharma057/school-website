"use client";

import { Box, Typography } from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";

export default function EmptyMenu() {
  return (
    <Box
      sx={{
        py: 6,

        textAlign: "center",

        color: "text.secondary",
      }}
    >
      <MenuIcon
        sx={{
          fontSize: 50,

          mb: 2,
        }}
      />

      <Typography variant="h6">No Menu Added</Typography>

      <Typography>Click Add Menu button to create navigation items.</Typography>
    </Box>
  );
}
