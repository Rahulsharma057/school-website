"use client";

import { useState } from "react";

import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";

import { Box } from "@mui/material";

const DRAWER_WIDTH = 260;
const HEADER_HEIGHT = 64;

export default function AdminLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        overflowX: "hidden",
        bgcolor: "#f8fafc",
      }}
    >
      {/* Header */}
      <Header handleDrawerToggle={handleDrawerToggle} />

      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          minHeight: "100vh",
          boxSizing: "border-box",

          // Mobile
          width: "100%",
          ml: 0,
          pt: `${HEADER_HEIGHT + 16}px`,
          px: {
            xs: 1.5,
            sm: 2,
            md: 3,
          },

          // Desktop
          "@media (min-width: 1200px)": {
            ml: `${DRAWER_WIDTH}px`,
            width: `calc(100% - ${DRAWER_WIDTH}px)`,
            pt: `${HEADER_HEIGHT + 24}px`,
            px: 3,
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}