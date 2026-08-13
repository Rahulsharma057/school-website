"use client";

import { Box } from "@mui/material";
import PortalGuard from "@/components/PortalGuard";

export default function PortalLayout({ children }) {
  return (
    <PortalGuard>
      <Box sx={{ minHeight: "100vh" }}>{children}</Box>
    </PortalGuard>
  );
}