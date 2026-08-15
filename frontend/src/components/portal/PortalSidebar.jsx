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
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import GradeIcon from "@mui/icons-material/Grade";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";

import { useAuth } from "@/context/AuthContext";
import filterMenuByRole from "@/utils/filterMenuByRole";

const DRAWER_WIDTH = 240;

const portalMenu = [
  // =========================
  // COMMON
  // =========================
  {
    title: "My Profile",
    path: "/portal/profile",
    icon: <PersonOutlineIcon />,
    roles: ["STUDENT", "TEACHER", "PARENT"],
    visible: true,
  },

  // =========================
  // STUDENT
  // =========================
  {
    title: "My Attendance",
    path: "/portal/attendance",
    icon: <FactCheckIcon />,
    roles: ["STUDENT"],
    visible: true,
  },
  {
    title: "My Results",
    path: "/portal/results",
    icon: <GradeIcon />,
    roles: ["STUDENT"],
    visible: true,
  },
  {
    title: "My Timetable",
    path: "/portal/timetable",
    icon: <CalendarMonthOutlinedIcon />,
    roles: ["STUDENT", "TEACHER"],
    visible: true,
  },
  {
    title: "My Fees",
    path: "/portal/fees",
    icon: <PaidOutlinedIcon />,
    roles: ["STUDENT"],
    visible: true,
  },
  {
    title: "Assessments",
    path: "/portal/my-assessments",
    icon: <QuizOutlinedIcon />,
    roles: ["STUDENT"],
    visible: true,
  },

  // =========================
  // TEACHER
  // =========================
  {
    title: "My Leave",
    path: "/portal/leave",
    icon: <EventBusyIcon />,
    roles: ["TEACHER"],
    visible: true,
  },
  {
    title: "My Salary",
    path: "/portal/salary",
    icon: <PaidOutlinedIcon />,
    roles: ["TEACHER"],
    visible: true,
  },
  {
    title: "Class Fee Status",
    path: "/portal/class-fees",
    icon: <PaidOutlinedIcon />,
    roles: ["TEACHER"],
    visible: true,
  },

  // Teacher attendance
  {
    title: "Class Attendance",
    path: "/portal/mark-class-attendance",
    icon: <FactCheckIcon />,
    roles: ["TEACHER"],
    visible: true,
  },

  {
    title: "My Tasks",
    path: "/portal/tasks",
    icon: <AssignmentOutlinedIcon />,
    roles: ["TEACHER"],
    visible: true,
  },

  {
    title: "Assessments",
    path: "/portal/assessments",
    icon: <QuizOutlinedIcon />,
    roles: ["TEACHER"],
    visible: true,
  },

  {
    title: "Enter Results",
    path: "/portal/teacher-results",
    icon: <AssignmentTurnedInOutlinedIcon />,
    roles: ["TEACHER"],
    visible: true,
  },
];

export default function PortalSidebar({
  mobileOpen,
  handleDrawerToggle,
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  const visibleMenu = filterMenuByRole(
    portalMenu,
    user?.role
  );

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        backgroundColor: "#ffffff",
      }}
    >
      {/* LOGO */}
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          px: 3,
          minHeight: "64px !important",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            color: "#1e293b",
            letterSpacing: -0.5,
          }}
        >
          MY
          <span style={{ color: "#3b82f6" }}>
            PORTAL
          </span>
        </Typography>
      </Toolbar>

      <Divider sx={{ opacity: 0.6 }} />

      <Box sx={{ p: 2 }}>
        {/* ROLE */}
        {user?.role && (
          <Typography
            variant="caption"
            sx={{
              pl: 1,
              color: "#94a3b8",
              fontWeight: 700,
              letterSpacing: 0.5,
            }}
          >
            {user.role === "STUDENT"
              ? "STUDENT MENU"
              : user.role === "TEACHER"
              ? "TEACHER MENU"
              : "MY ACCOUNT"}
          </Typography>
        )}

        <List sx={{ mt: 1 }}>
          {visibleMenu.map((item) => {
            /*
             * Exact path OR nested route
             */
            const isActive =
              pathname === item.path ||
              pathname.startsWith(`${item.path}/`);

            return (
              <ListItem
                key={item.path}
                disablePadding
                sx={{ mb: 0.5 }}
              >
                <ListItemButton
                  component={Link}
                  href={item.path}
                  onClick={handleDrawerToggle}
                  sx={{
                    borderRadius: "12px",
                    transition: "all 0.2s ease",

                    backgroundColor: isActive
                      ? "#eff6ff"
                      : "transparent",

                    color: isActive
                      ? "#2563eb"
                      : "#64748b",

                    "&:hover": {
                      backgroundColor: isActive
                        ? "#eff6ff"
                        : "#f1f5f9",

                      color: isActive
                        ? "#2563eb"
                        : "#1e293b",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: "inherit",
                    }}
                  >
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
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{
        width: {
          lg: DRAWER_WIDTH,
        },
        flexShrink: {
          lg: 0,
        },
      }}
    >
      {/* MOBILE DRAWER */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: {
            xs: "block",
            lg: "none",
          },

          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
            borderRight: "1px solid #e2e8f0",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* DESKTOP DRAWER */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: {
            xs: "none",
            lg: "block",
          },

          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
            borderRight: "1px solid #e2e8f0",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}