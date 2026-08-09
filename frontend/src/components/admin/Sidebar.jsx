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

// Icons
import DashboardIcon from "@mui/icons-material/Dashboard";
import HomeIcon from "@mui/icons-material/Home";
import CollectionsIcon from "@mui/icons-material/Collections";
import NewspaperIcon from "@mui/icons-material/Newspaper";
import EventIcon from "@mui/icons-material/Event";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";

const DRAWER_WIDTH = 260;

const menu = [
 // { title: "Dashboard", path: "/admin/dashboard", icon: <DashboardIcon /> },
  { title: "Home-slider", path: "/admin/home-slider", icon: <HomeIcon /> },
  { title: "Custom-pages", path: "/admin/custom-pages", icon: <CollectionsIcon /> },
  { title: "Users", path: "/admin/users", icon: <NewspaperIcon /> },
  { title: "Navbar", path: "/admin/navbar", icon: <EventIcon /> },
  { title: "Forms", path: "/admin/forms", icon: <PeopleIcon /> },
  { title: "Syllabus", path: "/admin/syllabus", icon: <SettingsIcon /> },
    { title: "Quotes", path: "/admin/quotes", icon: <PeopleIcon /> },
  { title: "News", path: "/admin/news", icon: <SettingsIcon /> },
    { title: "Contact-pages", path: "/admin/contact-pages", icon: <SettingsIcon /> },
    { title: "Announcements", path: "/admin/announcements", icon: <SettingsIcon /> },
  { title: "All Form Entries", path: "/admin/entries", icon: <SettingsIcon /> },
  { title: "Footer", path: "/admin/footer", icon: <SettingsIcon /> },
   
  { title: "Gallery", path: "/admin/gallery", icon: <SettingsIcon /> },
    
];

export default function Sidebar({ mobileOpen, handleDrawerToggle }) {
  const pathname = usePathname();

  const drawerContent = (
    <Box>
      <Toolbar sx={{ display: "flex", alignItems: "center", px: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b", letterSpacing: -0.5 }}>
          ADMIN<span style={{ color: "#3b82f6" }}>CORE</span>
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
                  onClick={handleDrawerToggle} // मोबाइल पर क्लिक करते ही बंद हो जाए
                  sx={{
                    borderRadius: "12px",
                    transition: "all 0.2s ease",
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
      {/* मोबाइल के लिए Drawer (Temporary) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }} // मोबाइल पर बेहतर परफॉरमेंस के लिए
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: DRAWER_WIDTH, borderRight: "1px solid #e2e8f0" },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* डेस्कटॉप के लिए Drawer (Permanent) */}
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