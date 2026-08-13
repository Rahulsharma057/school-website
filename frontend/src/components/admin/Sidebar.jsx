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
import HomeIcon from "@mui/icons-material/Home";
import CollectionsIcon from "@mui/icons-material/Collections";
import NewspaperIcon from "@mui/icons-material/Newspaper";
import EventIcon from "@mui/icons-material/Event";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import SchoolIcon from "@mui/icons-material/School";
import ClassIcon from "@mui/icons-material/Class";
import PersonIcon from "@mui/icons-material/Person";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import QuizIcon from "@mui/icons-material/Quiz";
import GradeIcon from "@mui/icons-material/Grade";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PaymentsIcon from "@mui/icons-material/Payments";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PaymentIcon from "@mui/icons-material/Payment";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { useAuth } from "@/context/AuthContext";

const DRAWER_WIDTH = 260;

// Common role groups (reuse ke liye)
const STAFF_ALL = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"];
const STAFF_WITH_ACCOUNTANT = [
  "SUPER_ADMIN",
  "ADMIN",
  "PRINCIPAL",
  "ACCOUNTANT",
];

// =========================================================
// Website / Content Management
// roles na di ho to sab staff dekh sakte hain (default)
// =========================================================
const contentMenu = [
  {
    title: "Home-slider",
    path: "/admin/home-slider",
    icon: <HomeIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Custom-pages",
    path: "/admin/custom-pages",
    icon: <CollectionsIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Users",
    path: "/admin/users",
    icon: <NewspaperIcon />,
    roles: ["SUPER_ADMIN"],
  },
  {
    title: "Navbar",
    path: "/admin/navbar",
    icon: <EventIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Forms",
    path: "/admin/forms",
    icon: <PeopleIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Syllabus",
    path: "/admin/syllabus",
    icon: <SettingsIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Quotes",
    path: "/admin/quotes",
    icon: <PeopleIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "News",
    path: "/admin/news",
    icon: <SettingsIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Contact-pages",
    path: "/admin/contact-pages",
    icon: <SettingsIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Announcements",
    path: "/admin/announcements",
    icon: <SettingsIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "All Form Entries",
    path: "/admin/entries",
    icon: <SettingsIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Footer",
    path: "/admin/footer",
    icon: <SettingsIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Gallery",
    path: "/admin/gallery",
    icon: <SettingsIcon />,
    roles: STAFF_ALL,
  },
];

// =========================================================
// School Management
// Accountant ko sirf Salary/Attendance-type cheezein — academic
// modules (Classes/Students/Promotions/Exams) nahi
// =========================================================
const schoolMenu = [
  {
    title: "Classes",
    path: "/admin/classes",
    icon: <ClassIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Students",
    path: "/admin/students",
    icon: <SchoolIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Teachers",
    path: "/admin/teachers",
    icon: <PersonIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Teacher Assignments",
    path: "/admin/teacher-assignments",
    icon: <AssignmentIndIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Attendance",
    path: "/admin/attendance",
    icon: <FactCheckIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Promotions",
    path: "/admin/promotions",
    icon: <TrendingUpIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Exams",
    path: "/admin/exams",
    icon: <QuizIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Results",
    path: "/admin/results",
    icon: <GradeIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Holidays",
    path: "/admin/holidays",
    icon: <EventAvailableIcon />,
    roles: STAFF_WITH_ACCOUNTANT,
  },
  {
    title: "Teacher Attendance",
    path: "/admin/teacher-attendance",
    icon: <FactCheckIcon />,
    roles: STAFF_WITH_ACCOUNTANT,
  },
  {
    title: "Leave Requests",
    path: "/admin/leave-requests",
    icon: <EventBusyIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Salary",
    path: "/admin/salary",
    icon: <PaidOutlinedIcon />,
    roles: STAFF_WITH_ACCOUNTANT,
  },
  {
    title: "Period Slots",
    path: "/admin/period-slots",
    icon: <ScheduleOutlinedIcon />,
    roles: STAFF_ALL,
    visible: true,
  },
  {
    title: "Timetable",
    path: "/admin/timetable",
    icon: <CalendarMonthOutlinedIcon />,
    roles: STAFF_ALL,
    visible: true,
  },
  {
    title: "Fee Dashboard",
    path: "/admin/fees/dashboard",
    icon: <DashboardIcon />,
    roles: STAFF_WITH_ACCOUNTANT,
  },
  {
    title: "Fees",
    path: "/admin/fees",
    icon: <AccountBalanceWalletIcon />,
    roles: STAFF_WITH_ACCOUNTANT,
  },
  {
    title: "Fee Structures",
    path: "/admin/fees/structures",
    icon: <ReceiptLongIcon />,
    roles: STAFF_WITH_ACCOUNTANT,
  },
  {
    title: "Assign Fees",
    path: "/admin/fees/assign",
    icon: <AssignmentIcon />,
    roles: STAFF_WITH_ACCOUNTANT,
  },
  {
    title: "Fee Payments",
    path: "/admin/fees/payments",
    icon: <PaymentsIcon />,
    roles: STAFF_WITH_ACCOUNTANT,
  },
  {
    title: "Due Fees",
    path: "/admin/fees/due-list",
    icon: <WarningAmberIcon />,
    roles: STAFF_WITH_ACCOUNTANT,
  },
/*   {
    title: "Collect Fee",
    path: "/admin/fees/collect",
    roles: STAFF_WITH_ACCOUNTANT,
    icon: <PaymentIcon />,
  }, */
];

// role ke hisaab se filter karne wala helper
const filterByRole = (items, role) => {
  return items.filter((item) => !item.roles || item.roles.includes(role));
};

function MenuSection({ items, pathname, handleDrawerToggle }) {
  if (items.length === 0) return null; // agar section mein kuch nahi bacha to section hi mat dikhao

  return (
    <List>
      {items.map((item) => {
        const isActive =
          pathname === item.path ||
          (item.path === "/admin/fees"
            ? pathname.startsWith("/admin/fees")
            : pathname.startsWith(`${item.path}/`));
        return (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              href={item.path}
              onClick={handleDrawerToggle}
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
                primaryTypographyProps={{
                  fontSize: "0.9rem",
                  fontWeight: isActive ? 600 : 500,
                }}
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}

export default function Sidebar({ mobileOpen, handleDrawerToggle }) {
  const pathname = usePathname();
  const { user } = useAuth();

  // user load hone se pehle kuch mat dikhao (flash of full menu se bachne ke liye)
  const role = user?.role;

  const visibleSchoolMenu = filterByRole(schoolMenu, role);
  const visibleContentMenu = filterByRole(contentMenu, role);

  const drawerContent = (
    <Box>
      <Toolbar sx={{ display: "flex", alignItems: "center", px: 3 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 800, color: "#1e293b", letterSpacing: -0.5 }}
        >
          ADMIN<span style={{ color: "#3b82f6" }}>CORE</span>
        </Typography>
      </Toolbar>
      <Divider sx={{ opacity: 0.6 }} />

      {visibleSchoolMenu.length > 0 && (
        <Box sx={{ p: 2 }}>
          <Typography
            variant="caption"
            sx={{
              pl: 1,
              color: "#94a3b8",
              fontWeight: 700,
              letterSpacing: 0.5,
            }}
          >
            SCHOOL MANAGEMENT
          </Typography>
          <MenuSection
            items={visibleSchoolMenu}
            pathname={pathname}
            handleDrawerToggle={handleDrawerToggle}
          />
        </Box>
      )}

      {visibleSchoolMenu.length > 0 && visibleContentMenu.length > 0 && (
        <Divider sx={{ opacity: 0.6, mx: 2 }} />
      )}

      {visibleContentMenu.length > 0 && (
        <Box sx={{ p: 2 }}>
          <Typography
            variant="caption"
            sx={{
              pl: 1,
              color: "#94a3b8",
              fontWeight: 700,
              letterSpacing: 0.5,
            }}
          >
            WEBSITE CONTENT
          </Typography>
          <MenuSection
            items={visibleContentMenu}
            pathname={pathname}
            handleDrawerToggle={handleDrawerToggle}
          />
        </Box>
      )}
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { lg: DRAWER_WIDTH }, flexShrink: { lg: 0 } }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
            borderRight: "1px solid #e2e8f0",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", lg: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
            borderRight: "1px solid #e2e8f0",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
