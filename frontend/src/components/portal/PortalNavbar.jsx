"use client";

import { AppBar, Toolbar, IconButton, Typography, Box, Button } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "@/context/AuthContext";

export default function PortalNavbar({ handleDrawerToggle }) {
  const { user, logout } = useAuth();

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { lg: `calc(100% - 240px)` },
        ml: { lg: "240px" },
        backgroundColor: "#fff",
        color: "#1e293b",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ display: { lg: "none" } }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, ml: "auto" }}>
          <Typography variant="body2">
            {user?.name} ({user?.role})
          </Typography>
          <Button size="small" startIcon={<LogoutIcon />} onClick={logout}>
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}