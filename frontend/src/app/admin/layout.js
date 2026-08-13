"use client";

import { useState } from "react";

import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";

import { Box } from "@mui/material";

const DRAWER_WIDTH = 260;

export default function AdminLayout({
  children,
}) {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  return (
    <Box
      sx={{
        width: "100%",

        minHeight: "100vh",

        bgcolor: "#f8fafc",

        overflowX: "hidden",
      }}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <Header
        handleDrawerToggle={
          handleDrawerToggle
        }
      />

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <Sidebar
        mobileOpen={mobileOpen}
        handleDrawerToggle={
          handleDrawerToggle
        }
      />

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <Box
        component="main"
        sx={{
          boxSizing: "border-box",

          width: "100%",

          minHeight: "100vh",

          pt: {
            xs: "84px",
            sm: "88px",
            md: "94px",
          },

          px: {
            xs: 1.5,
            sm: 2,
            md: 3,
          },

          overflowX: "hidden",

          /* ================================
             DESKTOP
          ================================= */

          "@media (min-width: 900px)": {
            ml: `${DRAWER_WIDTH}px`,

            width: `calc(100% - ${DRAWER_WIDTH}px)`,
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}