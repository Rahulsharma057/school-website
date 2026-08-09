"use client";

import { Box } from "@mui/material";
import NavbarPreview from "./NavbarPreview";

export default function DesktopPreview({ navbar }) {
  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: "#f5f5f5",
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid #ddd",
        boxShadow: 2,
      }}
    >
      {/* Desktop Screen */}
      <Box
        sx={{
          width: "100%",
          minHeight: 450,
          bgcolor: "#fff",
        }}
      >
        <NavbarPreview navbar={navbar} />

        {/* Dummy Content */}
        <Box
          sx={{
            p: 4,
          }}
        >
          <Box
            sx={{
              height: 220,
              borderRadius: 2,
              bgcolor: "#f3f4f6",
              mb: 3,
            }}
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 2,
            }}
          >
            {[1, 2, 3].map((item) => (
              <Box
                key={item}
                sx={{
                  height: 120,
                  borderRadius: 2,
                  bgcolor: "#eceff1",
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}