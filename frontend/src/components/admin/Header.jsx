"use client";

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Avatar,
  Tooltip,
  alpha,
  Divider,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";

import { useAuth } from "@/context/AuthContext";

export default function Header({ handleDrawerToggle }) {
  const auth = useAuth();

  if (!auth) return null;

  const { user, logout } = auth;

  const userName = user?.name || "Admin User";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,

        bgcolor: alpha("#ffffff", 0.95),
        backdropFilter: "blur(10px)",
        color: "#1e293b",

        boxShadow: "none",
        borderBottom: "1px solid #e2e8f0",

        height: {
          xs: 60,
          sm: 64,
          lg: 70,
        },
      }}
    >
      <Toolbar
        sx={{
          minHeight: {
            xs: "60px !important",
            sm: "64px !important",
            lg: "70px !important",
          },

          px: {
            xs: 1.5,
            sm: 2,
            md: 3,
          },

          display: "flex",
          justifyContent: "space-between",
          gap: 1,

          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* =========================
            LEFT SIDE
        ========================= */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            minWidth: 0,
            flex: 1,
          }}
        >
          {/* MOBILE / TABLET MENU */}
          <IconButton
            color="inherit"
            aria-label="open navigation menu"
            onClick={handleDrawerToggle}
            sx={{
              display: {
                xs: "flex",
                lg: "none",
              },

              mr: {
                xs: 0.5,
                sm: 1,
              },

              color: "#475569",

              width: 42,
              height: 42,

              "&:hover": {
                bgcolor: "#f1f5f9",
              },
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* TITLE */}
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontWeight: 700,

              fontSize: {
                xs: "1rem",
                sm: "1.1rem",
                md: "1.2rem",
              },

              letterSpacing: "-0.5px",

              overflow: "hidden",
              textOverflow: "ellipsis",

              display: {
                xs: "block",
                sm: "block",
              },
            }}
          >
            School{" "}
            <Box
              component="span"
              sx={{
                color: "#3b82f6",
              }}
            >
              Admin
            </Box>
          </Typography>
        </Box>

        {/* =========================
            RIGHT SIDE
        ========================= */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",

            gap: {
              xs: 0.5,
              sm: 1,
              md: 1.5,
            },

            flexShrink: 0,
          }}
        >
          {/* NOTIFICATION */}
          <Tooltip title="Notifications">
            <IconButton
              sx={{
                color: "#64748b",

                width: {
                  xs: 38,
                  sm: 40,
                },

                height: {
                  xs: 38,
                  sm: 40,
                },

                "&:hover": {
                  bgcolor: "#f1f5f9",
                },
              }}
            >
              <NotificationsNoneIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* DIVIDER */}
          <Divider
            orientation="vertical"
            flexItem
            sx={{
              my: 1.2,

              display: {
                xs: "none",
                sm: "block",
              },
            }}
          />

          {/* =========================
              USER
          ========================= */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",

              gap: {
                xs: 0,
                sm: 1,
                md: 1.5,
              },
            }}
          >
            {/* USER NAME */}
            <Box
              sx={{
                textAlign: "right",

                display: {
                  xs: "none",
                  md: "block",
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  lineHeight: 1.3,
                }}
              >
                {userName}
              </Typography>

              <Typography
                sx={{
                  fontSize: "0.75rem",
                  color: "#64748b",
                  lineHeight: 1.3,
                }}
              >
                {user?.role || "Admin"}
              </Typography>
            </Box>

            {/* AVATAR */}
            <Tooltip title={userName}>
              <Avatar
                sx={{
                  width: {
                    xs: 34,
                    sm: 36,
                    md: 38,
                  },

                  height: {
                    xs: 34,
                    sm: 36,
                    md: 38,
                  },

                  bgcolor: "#3b82f6",

                  fontSize: {
                    xs: "0.8rem",
                    md: "0.9rem",
                  },

                  fontWeight: 600,

                  border: "2px solid #eff6ff",
                }}
              >
                {userInitial}
              </Avatar>
            </Tooltip>
          </Box>

          {/* DIVIDER */}
          <Divider
            orientation="vertical"
            flexItem
            sx={{
              mx: {
                xs: 0.2,
                sm: 0.5,
              },

              my: 1.2,
            }}
          />

          {/* =========================
              LOGOUT
          ========================= */}
          <Button
            variant="contained"
            size="small"
            onClick={logout}
            aria-label="Logout"
            startIcon={
              <LogoutIcon
                sx={{
                  fontSize: "18px !important",
                }}
              />
            }
            sx={{
              bgcolor: "#fff",

              color: "#ef4444",

              fontWeight: 600,

              boxShadow: "none",

              border: "1px solid #fee2e2",

              textTransform: "none",

              minWidth: {
                xs: 38,
                sm: 42,
                md: 100,
              },

              width: {
                xs: 38,
                sm: 42,
                md: "auto",
              },

              height: {
                xs: 38,
                sm: 38,
                md: 40,
              },

              px: {
                xs: 0,
                sm: 0,
                md: 2,
              },

              borderRadius: "8px",

              "&:hover": {
                bgcolor: "#fef2f2",

                border: "1px solid #fecaca",

                boxShadow: "none",
              },

              "& .MuiButton-startIcon": {
                mr: {
                  xs: 0,
                  md: 1,
                },

                ml: 0,
              },
            }}
          >
            <Box
              component="span"
              sx={{
                display: {
                  xs: "none",
                  md: "inline",
                },
              }}
            >
              Logout
            </Box>
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
