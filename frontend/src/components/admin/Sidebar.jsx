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
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import { useAuth } from "@/context/AuthContext";

const DRAWER_WIDTH = 260;

const MOBILE_HEADER_HEIGHT = 60;
const TABLET_HEADER_HEIGHT = 64;
const DESKTOP_HEADER_HEIGHT = 70;

const STAFF_ALL = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"];

const STAFF_WITH_ACCOUNTANT = [
  "SUPER_ADMIN",
  "ADMIN",
  "PRINCIPAL",
  "ACCOUNTANT",
];

/* =====================================================
   WEBSITE CONTENT
===================================================== */

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
    icon: <PeopleIcon />,
    roles: ["SUPER_ADMIN"],
  },
  {
    title: "Navbar",
    path: "/admin/navbar",
    icon: <DashboardIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Forms",
    path: "/admin/forms",
    icon: <AssignmentIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Syllabus",
    path: "/admin/syllabus",
    icon: <SchoolIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Quotes",
    path: "/admin/quotes",
    icon: <GradeIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "News",
    path: "/admin/news",
    icon: <NewspaperIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Contact-pages",
    path: "/admin/contact-pages",
    icon: <PeopleIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Announcements",
    path: "/admin/announcements",
    icon: <EventIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "All Form Entries",
    path: "/admin/entries",
    icon: <FactCheckIcon />,
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
    icon: <CollectionsIcon />,
    roles: STAFF_ALL,
  },
];

/* =====================================================
   SCHOOL MANAGEMENT
===================================================== */

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
    icon: <PersonIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Teachers",
    path: "/admin/teachers",
    icon: <PeopleIcon />,
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
  },
  {
    title: "Timetable",
    path: "/admin/timetable",
    icon: <CalendarMonthOutlinedIcon />,
    roles: STAFF_ALL,
  },
  {
    title: "Fee Dashboard",
    path: "/admin/fees/dashboard",
    icon: <AccountBalanceWalletIcon />,
    roles: STAFF_WITH_ACCOUNTANT,
  },
  {
    title: "Fees",
    path: "/admin/fees",
    icon: <ReceiptLongIcon />,
    roles: STAFF_WITH_ACCOUNTANT,
  },
  {
    title: "Fee Structures",
    path: "/admin/fees/structures",
    icon: <AssignmentIcon />,
    roles: STAFF_WITH_ACCOUNTANT,
  },
  {
    title: "Assign Fees",
    path: "/admin/fees/assign",
    icon: <PaymentsIcon />,
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
  {
    title: "Tasks",
    path: "/admin/tasks",
    icon: <AssignmentOutlinedIcon />,
    roles: STAFF_ALL,
   // visible: true,
  },
];

/* =====================================================
   ROLE FILTER
===================================================== */

const filterByRole = (items, role) => {
  if (!role) return [];

  return items.filter((item) => !item.roles || item.roles.includes(role));
};

/* =====================================================
   MENU SECTION
===================================================== */

function MenuSection({ items, pathname, handleDrawerToggle, isMobile }) {
  if (!items.length) return null;

  return (
    <List disablePadding>
      {items.map((item) => {
        const isActive =
          pathname === item.path ||
          (item.path === "/admin/fees"
            ? pathname.startsWith("/admin/fees")
            : pathname.startsWith(`${item.path}/`));

        return (
          <ListItem
            key={item.path}
            disablePadding
            sx={{
              mb: 0.5,
            }}
          >
            <ListItemButton
              component={Link}
              href={item.path}
              onClick={isMobile ? handleDrawerToggle : undefined}
              selected={isActive}
              sx={{
                minHeight: 44,
                borderRadius: "10px",
                px: 1.5,

                color: isActive ? "#2563eb" : "#64748b",

                backgroundColor: isActive ? "#eff6ff" : "transparent",

                "&:hover": {
                  backgroundColor: isActive ? "#eff6ff" : "#f1f5f9",

                  color: isActive ? "#2563eb" : "#1e293b",
                },

                "&.Mui-selected": {
                  backgroundColor: "#eff6ff",
                  color: "#2563eb",
                },

                "&.Mui-selected:hover": {
                  backgroundColor: "#eff6ff",
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
                  noWrap: true,
                }}
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}

/* =====================================================
   SIDEBAR
===================================================== */

export default function Sidebar({ mobileOpen, handleDrawerToggle }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const role = user?.role;

  const visibleSchoolMenu = filterByRole(schoolMenu, role);

  const visibleContentMenu = filterByRole(contentMenu, role);

  /* =====================================================
     DRAWER CONTENT
  ===================================================== */

  const drawerContent = (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: "#fff",
      }}
    >
      {/* LOGO */}

      <Box
        sx={{
          height: {
            xs: MOBILE_HEADER_HEIGHT,
            sm: TABLET_HEADER_HEIGHT,
            md: DESKTOP_HEADER_HEIGHT,
          },

          minHeight: {
            xs: MOBILE_HEADER_HEIGHT,
            sm: TABLET_HEADER_HEIGHT,
            md: DESKTOP_HEADER_HEIGHT,
          },

          display: "flex",
          alignItems: "center",
          px: 2.5,
          flexShrink: 0,
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
          ADMIN
          <Box
            component="span"
            sx={{
              color: "#3b82f6",
            }}
          >
            CORE
          </Box>
        </Typography>
      </Box>

      <Divider />

      {/* ONLY THIS AREA SCROLLS */}

      <Box
        sx={{
          flex: 1,
          minHeight: 0,

          overflowY: "auto",
          overflowX: "hidden",

          overscrollBehavior: "contain",

          WebkitOverflowScrolling: "touch",

          scrollbarWidth: "thin",
          scrollbarColor: "#cbd5e1 transparent",

          "&::-webkit-scrollbar": {
            width: "6px",
          },

          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#cbd5e1",
            borderRadius: "10px",
          },

          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
        }}
      >
        {/* SCHOOL MANAGEMENT */}

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
              isMobile={true}
            />
          </Box>
        )}

        {visibleSchoolMenu.length > 0 && visibleContentMenu.length > 0 && (
          <Divider sx={{ mx: 2 }} />
        )}

        {/* WEBSITE CONTENT */}

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
              isMobile={true}
            />
          </Box>
        )}

        <Box sx={{ height: 30 }} />
      </Box>
    </Box>
  );

  return (
    <>
      {/* =================================================
          MOBILE / TABLET
      ================================================= */}

      <Drawer
        variant="temporary"
        anchor="left"
        open={Boolean(mobileOpen)}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: {
            xs: "block",
            md: "none",
          },

          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,

            top: {
              xs: MOBILE_HEADER_HEIGHT,
              sm: TABLET_HEADER_HEIGHT,
            },

            height: {
              xs: `calc(100dvh - ${MOBILE_HEADER_HEIGHT}px)`,
              sm: `calc(100dvh - ${TABLET_HEADER_HEIGHT}px)`,
            },

            boxSizing: "border-box",

            borderRight: "1px solid #e2e8f0",

            overflow: "hidden",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* =================================================
          DESKTOP
      ================================================= */}

      <Drawer
        variant="permanent"
        sx={{
          display: {
            xs: "none",
            md: "block",
          },

          width: DRAWER_WIDTH,

          flexShrink: 0,

          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,

            top: DESKTOP_HEADER_HEIGHT,

            height: `calc(100dvh - ${DESKTOP_HEADER_HEIGHT}px)`,

            boxSizing: "border-box",

            borderRight: "1px solid #e2e8f0",

            overflow: "hidden",

            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* IMPORTANT:
            Desktop par isMobile FALSE hona chahiye
        */}

        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            bgcolor: "#fff",
          }}
        >
          {/* LOGO */}

          <Box
            sx={{
              height: DESKTOP_HEADER_HEIGHT,
              minHeight: DESKTOP_HEADER_HEIGHT,
              display: "flex",
              alignItems: "center",
              px: 2.5,
              flexShrink: 0,
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
              ADMIN
              <Box
                component="span"
                sx={{
                  color: "#3b82f6",
                }}
              >
                CORE
              </Box>
            </Typography>
          </Box>

          <Divider />

          {/* DESKTOP SCROLL AREA */}

          <Box
            sx={{
              flex: 1,
              minHeight: 0,

              overflowY: "auto",
              overflowX: "hidden",

              overscrollBehavior: "contain",

              scrollbarWidth: "thin",
              scrollbarColor: "#cbd5e1 transparent",

              "&::-webkit-scrollbar": {
                width: "6px",
              },

              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#cbd5e1",
                borderRadius: "10px",
              },

              "&::-webkit-scrollbar-track": {
                backgroundColor: "transparent",
              },
            }}
          >
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
                  isMobile={false}
                />
              </Box>
            )}

            {visibleSchoolMenu.length > 0 && visibleContentMenu.length > 0 && (
              <Divider sx={{ mx: 2 }} />
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
                  isMobile={false}
                />
              </Box>
            )}

            <Box sx={{ height: 30 }} />
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
