"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
  Divider,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import GradeIcon from "@mui/icons-material/Grade";
import { useAuth } from "@/context/AuthContext";

const DRAWER_WIDTH = 240;

// role ke hisaab se menu items decide honge
const getMenuByRole = (role) => {
  const base = [
    { title: "My Profile", path: "/portal/profile", icon: <PersonIcon /> },
  ];

  if (role === "STUDENT") {
    base.push(
      { title: "My Attendance", path: "/portal/attendance", icon: <FactCheckIcon /> },
      { title: "My Results", path: "/portal/results", icon: <GradeIcon /> }
    );
  }
if (role === "TEACHER") {
  base.push(
    { title: "My Classes", path: "/portal/my-classes", icon: <FactCheckIcon /> },
    { title: "My Salary", path: "/portal/salary", icon: <PaidOutlinedIcon /> }
  );
}

  return base;
};

export default function PortalSidebar({ mobileOpen, handleDrawerToggle }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const menu = getMenuByRole(user?.role);

  const drawerContent = (
    <Box>
      <Toolbar sx={{ display: "flex", alignItems: "center", px: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b" }}>
          MY<span style={{ color: "#3b82f6" }}>PORTAL</span>
        </Typography>
      </Toolbar>
      <Divider sx={{ opacity: 0.6 }} />

      <Box sx={{ p: 2 }}>
        <List>
          {menu.map((item) => {
            const isActive = pathname === item.path;
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  href={item.path}
                  onClick={handleDrawerToggle}
                  sx={{
                    borderRadius: "12px",
                    backgroundColor: isActive ? "#eff6ff" : "transparent",
                    color: isActive ? "#2563eb" : "#64748b",
                    "&:hover": {
                      backgroundColor: isActive ? "#eff6ff" : "#f1f5f9",
                      color: isActive ? "#2563eb" : "#1e293b",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: isActive ? 600 : 500 }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { lg: DRAWER_WIDTH }, flexShrink: { lg: 0 } }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: DRAWER_WIDTH },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", lg: "block" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: DRAWER_WIDTH, borderRight: "1px solid #e2e8f0" },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}