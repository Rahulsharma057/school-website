"use client";

import { useState } from "react";
import { Box, Toolbar } from "@mui/material";

import PortalGuard from "@/components/PortalGuard";
import PortalSidebar from "@/components/portal/PortalSidebar";
import PortalNavbar from "@/components/portal/PortalNavbar";

const DRAWER_WIDTH = 240;

export default function PortalLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  return (
    <PortalGuard>
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          backgroundColor: "#f8fafc",
        }}
      >
        {/* PORTAL NAVBAR */}
        <PortalNavbar handleDrawerToggle={handleDrawerToggle} />

        {/* PORTAL SIDEBAR */}
        <PortalSidebar
          mobileOpen={mobileOpen}
          handleDrawerToggle={handleDrawerToggle}
        />

        {/* MAIN CONTENT */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,

            width: {
              xs: "100%",
              lg: `calc(100% - ${DRAWER_WIDTH}px)`,
            },

            minHeight: "100vh",

            backgroundColor: "#f8fafc",
          }}
        >
          {/* Navbar spacing */}
          <Toolbar />

          {children}
        </Box>
      </Box>
    </PortalGuard>
  );
}
