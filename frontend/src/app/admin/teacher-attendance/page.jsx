"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  CheckCircle,
  EventBusy,
  FactCheck,
  HourglassBottom,
  PersonOff,
  Refresh,
  Save,
  Search,
  RestartAlt,
} from "@mui/icons-material";

import { useAllTeachers } from "@/hooks/useTeacher";
import { useMarkTeacherAttendance } from "@/hooks/useTeacherAttendance";

// =====================================================
// CONSTANTS — single source of truth (no duplication)
// =====================================================

const STATUS_CONFIG = [
  {
    value: "PRESENT",
    label: "Present",
    short: "P",
    color: "#15803D",
    bg: "#DCFCE7",
    icon: CheckCircle,
  },
  {
    value: "ABSENT",
    label: "Absent",
    short: "A",
    color: "#DC2626",
    bg: "#FEE2E2",
    icon: PersonOff,
  },
  {
    value: "HALF_DAY",
    label: "Half Day",
    short: "H",
    color: "#B45309",
    bg: "#FEF3C7",
    icon: HourglassBottom,
  },
  {
    value: "LEAVE",
    label: "Leave",
    short: "L",
    color: "#6D28D9",
    bg: "#EDE9FE",
    icon: EventBusy,
  },
];

const STATUS_MAP = STATUS_CONFIG.reduce(
  (acc, s) => ({ ...acc, [s.value]: s }),
  {},
);
const DEFAULT_STATUS = "PRESENT";

const COLORS = {
  primary: "#4C1D95",
  primaryDark: "#3B176D",
  primaryLight: "#5B21B6",
  accent: "#6D28D9",
  border: "#E5E7EB",
  bgPage: "#F7F8FC",
  bgSubtle: "#F8FAFC",
  textMuted: "#6B7280",
  textDark: "#1E1B2E",
};

// =====================================================
// HELPERS
// =====================================================

const getToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatDate = (date) =>
  date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const getTeacherId = (t) => t?._id || t?.user?._id || "";
const getTeacherName = (t) =>
  t?.name || t?.user?.name || t?.fullName || "Unknown Teacher";
const getTeacherEmail = (t) => t?.email || t?.user?.email || "";
const getTeacherPhoto = (t) =>
  t?.profilePhoto || t?.photo || t?.user?.profilePhoto || t?.user?.photo || "";

const normalizeTeachers = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.teachers)) return res.teachers;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.teachers)) return res.data.teachers;
  if (Array.isArray(res?.results)) return res.results;
  return [];
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function TeacherAttendancePage() {
  const {
    data: teachersResponse,
    isLoading: teachersLoading,
    isFetching: teachersFetching,
    isError: teachersError,
    refetch: refetchTeachers,
  } = useAllTeachers();

  const { mutate: markAttendance, isPending } = useMarkTeacherAttendance();

  const teachers = useMemo(
    () => normalizeTeachers(teachersResponse),
    [teachersResponse],
  );

  const [date, setDate] = useState(getToday);
  const [statusMap, setStatusMap] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!teachers.length) return setStatusMap({});
    const map = {};
    teachers.forEach((t) => {
      const id = getTeacherId(t);
      if (id) map[id] = DEFAULT_STATUS;
    });
    setStatusMap(map);
  }, [teachers]);

  const handleStatusChange = useCallback((teacherId, status) => {
    if (!status) return; // ignore deselect clicks on ToggleButtonGroup
    setStatusMap((prev) => ({ ...prev, [teacherId]: status }));
  }, []);

  const markAllPresent = useCallback(() => {
    const map = {};
    teachers.forEach((t) => {
      const id = getTeacherId(t);
      if (id) map[id] = DEFAULT_STATUS;
    });
    setStatusMap(map);
  }, [teachers]);

  const resetAttendance = useCallback(() => {
    markAllPresent();
    setSearch("");
  }, [markAllPresent]);

  const counts = useMemo(() => {
    const values = Object.values(statusMap);
    const base = { total: teachers.length };
    STATUS_CONFIG.forEach((s) => {
      base[s.value] = values.filter((v) => v === s.value).length;
    });
    return base;
  }, [teachers, statusMap]);

  const filteredTeachers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) => {
      const name = getTeacherName(t).toLowerCase();
      const email = getTeacherEmail(t).toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [teachers, search]);

  const handleSubmit = useCallback(() => {
    if (!date || !teachers.length) return;

    const records = teachers
      .map((t) => {
        const id = getTeacherId(t);
        if (!id) return null;
        return { teacher: id, status: statusMap[id] || DEFAULT_STATUS };
      })
      .filter(Boolean);

    if (!records.length) return;
    markAttendance({ date, records });
  }, [date, teachers, statusMap, markAttendance]);

  if (teachersLoading) {
    return (
      <PageContainer>
        <Stack spacing={1}>
          <Skeleton variant="rounded" height={64} />
          <Skeleton variant="rounded" height={110} />
          <Skeleton variant="rounded" height={72} />
          <Skeleton variant="rounded" height={320} />
        </Stack>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* HEADER */}
<Box
  sx={{
    mb: 2,
    display: "flex",
    alignItems: { xs: "flex-start", md: "center" },
    justifyContent: "space-between",
    gap: 2,
    flexWrap: "wrap",
    width: "100%",
  }}
>
  {/* Left: Heading */}
  <Stack
    direction="row"
    spacing={1.5}
    alignItems="center"
    sx={{
      flexShrink: 0,
      minWidth: { xs: "100%", md: "auto" },
    }}
  >
    <Avatar
      sx={{
        width: 44,
        height: 44,
        bgcolor: COLORS.primaryDark,
        color: "#fff",
        flexShrink: 0,
      }}
    >
      <FactCheck fontSize="small" />
    </Avatar>

    <Box>
      <Typography
        sx={{
          fontSize: { xs: 21, md: 25 },
          fontWeight: 800,
          color: COLORS.textDark,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
        }}
      >
        Teacher Attendance
      </Typography>

      <Typography
        variant="body2"
        sx={{
          color: COLORS.textMuted,
          mt: 0.3,
          whiteSpace: "nowrap",
        }}
      >
        Manage daily staff attendance
      </Typography>
    </Box>
  </Stack>

  {/* Right: Summary Cards — SAME ROW */}
  {teachers.length > 0 && (
    <Box
      sx={{
        display: "flex",
        alignItems: "stretch",
        gap: 1.25,
        flex: 1,
        justifyContent: { xs: "flex-start", md: "flex-end" },
        width: { xs: "100%", md: "auto" },
        overflowX: { xs: "auto", md: "visible" },
        pb: { xs: 0.5, md: 0 },
      }}
    >
      <Box sx={{ minWidth: { xs: 120, md: 115 } }}>
        <SummaryCard
          title="Teachers"
          value={counts.total}
          color={COLORS.primaryLight}
          icon={FactCheck}
        />
      </Box>

      {STATUS_CONFIG
        .filter((s) => s.value !== "HALF_DAY")
        .map((s) => (
          <Box
            key={s.value}
            sx={{
              minWidth: { xs: 120, md: 115 },
            }}
          >
            <SummaryCard
              title={s.label}
              value={
                s.value === "LEAVE"
                  ? counts.LEAVE + counts.HALF_DAY
                  : counts[s.value]
              }
              color={s.color}
              icon={s.icon}
            />
          </Box>
        ))}
    </Box>
  )}
</Box>

      {teachersError && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => refetchTeachers()}
            >
              Retry
            </Button>
          }
        >
          Unable to load teachers. Please try again.
        </Alert>
      )}

      {/* CONTROLS */}
    <Paper elevation={0} sx={cardSx}>
  <Box sx={{ p: { xs: 1.5, md: 2 } }}>
    <Grid container spacing={1.5} alignItems="center">

      {/* Search */}
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          fullWidth
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          label="Search Teacher"
          placeholder="Name or email"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Grid>

      {/* Date */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <TextField
          fullWidth
          size="small"
          type="date"
          label="Attendance Date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      {/* Reset */}
      <Grid size={{ xs: 12, sm: 6, md: 1.5 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<RestartAlt />}
          onClick={resetAttendance}
          sx={{
            height: 40,
            borderRadius: 1.5,
            textTransform: "none",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          Reset
        </Button>
      </Grid>

      {/* Refresh */}
      <Grid size={{ xs: 12, sm: 6, md: 1.5 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={
            <Refresh
              sx={{
                animation: teachersFetching
                  ? "spin 1s linear infinite"
                  : "none",
                "@keyframes spin": {
                  from: {
                    transform: "rotate(0deg)",
                  },
                  to: {
                    transform: "rotate(360deg)",
                  },
                },
              }}
            />
          }
          onClick={() => refetchTeachers()}
          disabled={teachersFetching}
          sx={{
            ...btnOutlined,
            height: 40,
            borderRadius: 1.5,
            whiteSpace: "nowrap",
          }}
        >
          Refresh
        </Button>
      </Grid>

      {/* Mark All Present */}
      <Grid
        size={{ xs: 12, sm: 6, md: 2 }}
        sx={{
          display: "flex",
          justifyContent: {
            xs: "flex-start",
            md: "center",
          },
          alignItems: "center",
        }}
      >
        <Button
          size="small"
          variant="text"
          onClick={markAllPresent}
          startIcon={<CheckCircle />}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            color: STATUS_MAP.PRESENT.color,
            whiteSpace: "nowrap",
            minWidth: "auto",
          }}
        >
          Mark All Present
        </Button>
      </Grid>

    </Grid>
  </Box>
</Paper>

 

      {/* TABLE */}
    <Paper
  elevation={0}
  sx={{
    ...cardSx,
    overflow: "hidden",
    borderRadius: 2,
  }}
>
  {!filteredTeachers.length ? (
    <EmptyState />
  ) : (
    <Box
      sx={{
        width: "100%",
        overflowX: "auto",
        "&::-webkit-scrollbar": {
          height: 6,
        },
      }}
    >
      <Box
        sx={{
          minWidth: 760,
        }}
      >
        {/* ================= TABLE HEADER ================= */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "58px minmax(280px, 1fr) minmax(320px, 1fr)",
            alignItems: "center",

            minHeight: 40,
            px: { xs: 1.5, md: 2 },

            bgcolor: "#6B21A8",
            color: "#fff",

            borderBottom: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {/* # */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Typography
              sx={{
                fontSize: 11.5,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: 0.4,
              }}
            >
              #
            </Typography>
          </Box>

          {/* Teacher */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Typography
              sx={{
                fontSize: 11.5,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: 0.4,
              }}
            >
              TEACHER
            </Typography>
          </Box>

          {/* Status */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Typography
              sx={{
                fontSize: 11.5,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: 0.4,
              }}
            >
              ATTENDANCE STATUS
            </Typography>
          </Box>
        </Box>

        {/* ================= TABLE ROWS ================= */}
        {filteredTeachers.map((teacher, index) => {
          const teacherId = getTeacherId(teacher);

          if (!teacherId) return null;

          return (
            <TeacherRow
              key={teacherId}
              index={index}
              name={getTeacherName(teacher)}
              email={getTeacherEmail(teacher)}
              photo={getTeacherPhoto(teacher)}
              status={statusMap[teacherId] || DEFAULT_STATUS}
              onChange={(status) =>
                handleStatusChange(teacherId, status)
              }
            />
          );
        })}
      </Box>
    </Box>
  )}

  {/* ================= SAVE FOOTER ================= */}
  {teachers.length > 0 && (
    <>
      <Divider />

      <Box
        sx={{
          minHeight: 62,

          px: { xs: 1.5, md: 2 },

          py: 1,

          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",

          gap: 2,

          backgroundColor: "#FAF8FC",

          flexWrap: {
            xs: "wrap",
            sm: "nowrap",
          },
        }}
      >
        {/* LEFT SUMMARY */}
        <Box
          sx={{
            minWidth: 0,
            flex: 1,
          }}
        >
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 800,
              color: COLORS.textDark,
              lineHeight: 1.3,
            }}
          >
            Ready to save attendance
          </Typography>

          <Typography
            sx={{
              mt: 0.35,
              fontSize: 11.5,
              color: COLORS.textMuted,
              lineHeight: 1.4,

              whiteSpace: {
                xs: "normal",
                sm: "nowrap",
              },
            }}
          >
            {formatDate(date)} • {counts.PRESENT} present •{" "}
            {counts.ABSENT} absent • {counts.HALF_DAY} half day •{" "}
            {counts.LEAVE} leave
          </Typography>
        </Box>

        {/* RIGHT BUTTON */}
        <Button
          variant="contained"
          disableElevation
          startIcon={
            isPending ? (
              <CircularProgress
                size={16}
                thickness={4}
                color="inherit"
              />
            ) : (
              <Save fontSize="small" />
            )
          }
          onClick={handleSubmit}
          disabled={isPending || !teachers.length}
          sx={{
            flexShrink: 0,

            height: 38,
            minWidth: 148,

            px: 2,

            borderRadius: 1.5,

            bgcolor: "#6B21A8",

            color: "#fff",

            textTransform: "none",

            fontSize: 13,
            fontWeight: 800,

            whiteSpace: "nowrap",

            "&:hover": {
              bgcolor: "#581C87",
            },

            "&:disabled": {
              bgcolor: "#D6D1DA",
              color: "#fff",
            },
          }}
        >
          {isPending ? "Saving..." : "Save Attendance"}
        </Button>
      </Box>
    </>
  )}
</Paper>
    </PageContainer>
  );
}

// =====================================================
// SUB-COMPONENTS
// =====================================================

function TeacherRow({ index, name, email, photo, status, onChange }) {
  return (
    <Box
      sx={{
        ...rowGridSx("#fff"),
        py: 1.25,
        "&:hover": { backgroundColor: "#FAF8FF" },
      }}
    >
      <Typography variant="body2" color="text.secondary" fontWeight={600}>
        {index + 1}
      </Typography>

      <Stack direction="row" spacing={1.2} alignItems="center" minWidth={0}>
        <Avatar
          src={photo || undefined}
          sx={{
            width: 38,
            height: 38,
            bgcolor: COLORS.primaryLight,
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          {name.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} noWrap>
            {name}
          </Typography>
          {email && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {email}
            </Typography>
          )}
        </Box>
      </Stack>

      <StatusToggle value={status} onChange={onChange} />
    </Box>
  );
}

function StatusToggle({ value, onChange }) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      size="small"
      onChange={(_, v) => onChange(v)}
      sx={{ flexWrap: "wrap", gap: 0.75 }}
    >
      {STATUS_CONFIG.map((s) => {
        const Icon = s.icon;
        const active = value === s.value;
        return (
          <Tooltip title={s.label} key={s.value}>
            <ToggleButton
              value={s.value}
              sx={{
                px: 1.2,
                py: 0.4,
                border: `1px solid ${active ? s.color : COLORS.border}`,
                borderRadius: "8px !important",
                textTransform: "none",
                fontWeight: 700,
                fontSize: 12.5,
                color: active ? s.color : "#6B7280",
                backgroundColor: active ? s.bg : "transparent",
                "&.Mui-selected": {
                  backgroundColor: s.bg,
                  color: s.color,
                  "&:hover": { backgroundColor: s.bg },
                },
                "&:hover": { backgroundColor: active ? s.bg : "#F9FAFB" },
              }}
            >
              <Icon sx={{ fontSize: 15, mr: 0.5 }} />
              {s.label}
            </ToggleButton>
          </Tooltip>
        );
      })}
    </ToggleButtonGroup>
  );
}

function SummaryCard({ title, value, color, icon: Icon }) {
  return (
    <Paper
      elevation={0}
      sx={{
        px: 1.5,
        py: 1.25,
        borderRadius: 2,
        border: `1px solid ${COLORS.border}`,
        backgroundColor: "#fff",
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {title}
          </Typography>
          <Typography
            sx={{
              mt: 0.2,
              fontSize: 22,
              lineHeight: 1,
              fontWeight: 800,
              color: "#1F2937",
            }}
          >
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color,
            backgroundColor: `${color}14`,
          }}
        >
          <Icon fontSize="small" />
        </Box>
      </Stack>
    </Paper>
  );
}

function EmptyState() {
  return (
    <Box sx={{ py: 7, px: 2, textAlign: "center" }}>
      <Avatar
        sx={{
          mx: "auto",
          mb: 1.5,
          width: 48,
          height: 48,
          bgcolor: "#F3F4F6",
          color: "#9CA3AF",
        }}
      >
        <Search />
      </Avatar>
      <Typography fontWeight={700}>No teachers found</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Try changing your search.
      </Typography>
    </Box>
  );
}

function HeaderCell({ children }) {
  return (
    <Typography variant="caption" fontWeight={800} color="text.secondary">
      {children}
    </Typography>
  );
}

function PageContainer({ children }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: COLORS.bgPage,
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, md: 2.5 },
      }}
    >
      <Box sx={{ maxWidth: 1500, mx: "auto" }}>{children}</Box>
    </Box>
  );
}

// =====================================================
// SHARED STYLES
// =====================================================

const cardSx = {
  mb: 2,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 2.5,
  overflow: "hidden",
  backgroundColor: "#fff",
};

const rowGridSx = (bg) => ({
  display: "grid",
  gridTemplateColumns: "48px minmax(200px, 1fr) minmax(340px, 460px)",
  gap: 1,
  alignItems: "center",
  px: 2,
  py: 1.1,
  backgroundColor: bg,
  borderBottom: "1px solid #EEF0F3",
});

const btnOutlined = {
  minHeight: 40,
  borderRadius: 1.5,
  textTransform: "none",
  fontWeight: 700,
  color: COLORS.primaryLight,
  borderColor: "#D8B4FE",
};

const btnSave = {
  minWidth: 190,
  minHeight: 42,
  borderRadius: 1.5,
  textTransform: "none",
  fontWeight: 700,
  backgroundColor: COLORS.primaryDark,
  boxShadow: "none",
  "&:hover": {
    backgroundColor:
      COLORS.primaryDark === "#4C1D95" ? "#3B176D" : COLORS.primaryDark,
    boxShadow: "none",
  },
};
