"use client";

import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Button,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";

import { useAuth } from "@/context/AuthContext";

const DRAWER_WIDTH = 240;

export default function PortalNavbar({
  handleDrawerToggle,
}) {
  const { user, logout } = useAuth();

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: {
          xs: "100%",
          lg: `calc(100% - ${DRAWER_WIDTH}px)`,
        },

        ml: {
          lg: `${DRAWER_WIDTH}px`,
        },

        backgroundColor: "#ffffff",

        color: "#1e293b",

        borderBottom: "1px solid #e2e8f0",

        boxShadow: "none",

        zIndex: (theme) =>
          theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          minHeight: "64px !important",
        }}
      >
        {/* MOBILE MENU */}
        <IconButton
          color="inherit"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{
            display: {
              xs: "flex",
              lg: "none",
            },
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* RIGHT SIDE */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            ml: "auto",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              display: {
                xs: "none",
                sm: "block",
              },

              fontWeight: 500,
              color: "#475569",
            }}
          >
            {user?.name || "User"}
            {user?.role
              ? ` (${user.role})`
              : ""}
          </Typography>

          <Button
            size="small"
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={logout}
            sx={{
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}