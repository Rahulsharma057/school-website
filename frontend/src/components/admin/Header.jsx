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
  alpha,Divider
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { useAuth } from "@/context/AuthContext";

export default function Header({ handleDrawerToggle }) {
  const auth = useAuth();

  if (!auth) return null;

  const { user, logout } = auth;

  return (
    <AppBar
      position="fixed"
      sx={{
        // Sidebar के ऊपर रहे इसके लिए zIndex
        zIndex: (theme) => theme.zIndex.drawer + 1,
        // Modern White Theme with Blur
        bgcolor: alpha("#ffffff", 0.8),
        backdropFilter: "blur(8px)",
        color: "#1e293b",
        boxShadow: "none",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", minHeight: { xs: 64, lg: 70 } }}>
        
        {/* Left Side: Mobile Menu Button & Title */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { lg: "none" }, color: "#64748b" }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.1rem", md: "1.25rem" },
              letterSpacing: "-0.5px",
              display: { xs: "none", sm: "block" } // मोबाइल पर छोटा नाम रखने के लिए
            }}
          >
            School <span style={{ color: "#3b82f6" }}>Admin</span>
          </Typography>
        </Box>

        {/* Right Side: Icons, User Info & Logout */}
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 2 } }}>
          
          {/* Notification Icon (Optional but looks professional) */}
          <IconButton sx={{ color: "#64748b" }}>
            <NotificationsNoneIcon fontSize="small" />
          </IconButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1.5, display: { xs: "none", sm: "block" } }} />

          {/* User Profile Section */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ textAlign: "right", display: { xs: "none", md: "block" } }}>
              <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#1e293b" }}>
                {user?.name || "Admin User"}
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "#64748b" }}>
                Super Admin
              </Typography>
            </Box>
            
            <Tooltip title="Account settings">
              <Avatar 
                sx={{ 
                  width: 38, 
                  height: 38, 
                  bgcolor: "#3b82f6", 
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  border: "2px solid #eff6ff"
                }}
              >
                {user?.name?.charAt(0) || "A"}
              </Avatar>
            </Tooltip>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1.5 }} />

          {/* Logout Button */}
          <Button
            variant="contained"
            size="small"
            onClick={logout}
            startIcon={<LogoutIcon sx={{ fontSize: "18px !important" }} />}
            sx={{
              bgcolor: "#fff",
              color: "#ef4444",
              fontWeight: 600,
              boxShadow: "none",
              border: "1px solid #fee2e2",
              textTransform: "none",
              px: 2,
              borderRadius: "8px",
              "&:hover": {
                bgcolor: "#fef2f2",
                border: "1px solid #fecaca",
                boxShadow: "none",
              },
              // मोबाइल पर केवल आइकॉन दिखाएँ या छोटा करें
              minWidth: { xs: "auto", md: "100px" },
              "& .MuiButton-startIcon": { mr: { xs: 0, md: 1 } }
            }}
          >
            <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
              Logout
            </Box>
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
