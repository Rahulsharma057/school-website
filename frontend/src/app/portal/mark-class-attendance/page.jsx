"use client";

import { useEffect, useMemo, useState } from "react";
import PortalGuard from "@/components/PortalGuard";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import {
  Search,
  CheckCircle,
  Cancel,
  EventBusy,
  Refresh,
  FilterAltOff,
  Save,
  DoneAll,
  Groups,
} from "@mui/icons-material";

import { useMyAssignments } from "@/hooks/useTeacherAssignments";
import { useStudentsByClass } from "@/hooks/useStudent";

import {
  useClassAttendance,
  useMarkAttendance,
  useUpdateAttendance,
} from "@/hooks/useAttendance";

const STATUS = {
  ALL: "ALL",
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  LEAVE: "LEAVE",
};

/* ======================================================
   DESIGN TOKENS — violet, corporate/enterprise palette
====================================================== */

const T = {
  primary: "#6D28D9",
  primaryDark: "#5B21B6",
  primaryLight: "#8B5CF6",
  primarySoft: "#F5F3FF",
  bg: "#F8F7FC",
  surface: "#FFFFFF",
  border: "#E7E3F5",
  textPrimary: "#1E1B2E",
  textSecondary: "#6F6B87",
  success: "#15803D",
  successSoft: "#EEFBF3",
  error: "#B91C1C",
  errorSoft: "#FEF2F2",
  warning: "#B45309",
  warningSoft: "#FFF8EB",
};

const STATUS_STYLES = {
  [STATUS.PRESENT]: { color: T.success, bg: T.successSoft, label: "Present" },
  [STATUS.ABSENT]: { color: T.error, bg: T.errorSoft, label: "Absent" },
  [STATUS.LEAVE]: { color: T.warning, bg: T.warningSoft, label: "Leave" },
};

/* ======================================================
   HELPERS
====================================================== */

const getToday = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (date) => {
  if (!date) return "";

  const [year, month, day] = date.split("-");

  if (!year || !month || !day) return date;

  return `${day}/${month}/${year}`;
};

const getStatusLabel = (status) =>
  STATUS_STYLES[status]?.label || "-";

/* ======================================================
   MAIN
====================================================== */

function TeacherAttendanceContent() {
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(getToday());

  const [statusMap, setStatusMap] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(STATUS.ALL);

  /* ======================================================
     ASSIGNMENTS
  ====================================================== */

  const {
    data: assignments = [],
    isLoading: assignmentsLoading,
    isFetching: assignmentsFetching,
    refetch: refetchAssignments,
  } = useMyAssignments();

  /* ======================================================
     ASSIGNED CLASSES ONLY
  ====================================================== */

  const assignedClasses = useMemo(() => {
    const map = new Map();

    if (!Array.isArray(assignments)) {
      return [];
    }

    assignments.forEach((assignment) => {
      const cls = assignment?.class;

      if (!cls?._id) return;

      if (!map.has(String(cls._id))) {
        map.set(String(cls._id), {
          ...cls,
        });
      }
    });

    return Array.from(map.values());
  }, [assignments]);

  /* ======================================================
     STUDENTS
  ====================================================== */

  const {
    data: studentsResponse,
    isLoading: studentsLoading,
    isFetching: studentsFetching,
  } = useStudentsByClass(classId);

  const classStudents = useMemo(() => {
    if (Array.isArray(studentsResponse)) {
      return studentsResponse;
    }

    if (Array.isArray(studentsResponse?.students)) {
      return studentsResponse.students;
    }

    if (Array.isArray(studentsResponse?.data)) {
      return studentsResponse.data;
    }

    if (Array.isArray(studentsResponse?.data?.students)) {
      return studentsResponse.data.students;
    }

    if (Array.isArray(studentsResponse?.results)) {
      return studentsResponse.results;
    }

    return [];
  }, [studentsResponse]);

  /* ======================================================
     EXISTING ATTENDANCE
  ====================================================== */

  const {
    data: existing,
    isLoading: attendanceLoading,
    isFetching: attendanceFetching,
    refetch,
  } = useClassAttendance(classId, date);

  /* ======================================================
     MUTATIONS
  ====================================================== */

  const { mutate: markAttendance, isPending: marking } = useMarkAttendance();

  const { mutate: updateAttendance, isPending: updating } =
    useUpdateAttendance();

  const saving = marking || updating;

  /* ======================================================
     SELECTED CLASS
  ====================================================== */

  const selectedClass = useMemo(() => {
    return assignedClasses.find(
      (item) => String(item._id) === String(classId)
    );
  }, [assignedClasses, classId]);

  /* ======================================================
     AUTO SELECT CLASS
  ====================================================== */

  useEffect(() => {
    if (!classId && assignedClasses.length > 0) {
      setClassId(assignedClasses[0]._id);
    }
  }, [assignedClasses, classId]);

  /* ======================================================
     RESET FILTERS WHEN CLASS / DATE CHANGES
  ====================================================== */

  useEffect(() => {
    setSearch("");
    setStatusFilter(STATUS.ALL);
    setStatusMap({});
  }, [classId, date]);

  /* ======================================================
     INITIALIZE STATUS
  ====================================================== */

  useEffect(() => {
    if (!classStudents.length) {
      setStatusMap({});
      return;
    }

    const map = {};

    // Default all students to PRESENT
    classStudents.forEach((student) => {
      const studentId = student?.user?._id;

      if (studentId) {
        map[String(studentId)] = STATUS.PRESENT;
      }
    });

    // Existing attendance overrides default
    if (Array.isArray(existing?.records)) {
      existing.records.forEach((record) => {
        const studentId = record?.student?._id || record?.student;

        if (studentId) {
          map[String(studentId)] = record.status;
        }
      });
    }

    setStatusMap(map);
  }, [classStudents, existing]);

  /* ======================================================
     CHANGE STATUS
  ====================================================== */

  const handleStatusChange = (studentId, status) => {
    if (!studentId || !status) return;

    setStatusMap((previous) => ({
      ...previous,
      [String(studentId)]: status,
    }));
  };

  /* ======================================================
     BULK STATUS
  ====================================================== */

  const markAll = (status) => {
    const map = {};

    classStudents.forEach((student) => {
      const studentId = student?.user?._id;

      if (studentId) {
        map[String(studentId)] = status;
      }
    });

    setStatusMap(map);
  };

  /* ======================================================
     COUNTS
  ====================================================== */

  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;

    classStudents.forEach((student) => {
      const studentId = student?.user?._id;

      const status = statusMap[String(studentId)] || STATUS.PRESENT;

      if (status === STATUS.PRESENT) present++;
      if (status === STATUS.ABSENT) absent++;
      if (status === STATUS.LEAVE) leave++;
    });

    return {
      total: classStudents.length,
      present,
      absent,
      leave,
    };
  }, [classStudents, statusMap]);

  /* ======================================================
     FILTERED STUDENTS
  ====================================================== */

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return classStudents.filter((student) => {
      const studentId = student?.user?._id;

      const name = student?.user?.name || "";
      const email = student?.user?.email || "";
      const roll = String(student?.rollNumber || "");

      const currentStatus =
        statusMap[String(studentId)] || STATUS.PRESENT;

      const searchMatched =
        !query ||
        name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        roll.toLowerCase().includes(query);

      const statusMatched =
        statusFilter === STATUS.ALL || currentStatus === statusFilter;

      return searchMatched && statusMatched;
    });
  }, [classStudents, search, statusFilter, statusMap]);

  /* ======================================================
     CLEAR FILTERS
  ====================================================== */

  const clearFilters = () => {
    setSearch("");
    setStatusFilter(STATUS.ALL);
  };

  /* ======================================================
     SAVE
  ====================================================== */

  const handleSubmit = () => {
    if (!classId || !classStudents.length || saving) {
      return;
    }

    const records = classStudents
      .map((student) => {
        const studentId = student?.user?._id;

        if (!studentId) return null;

        return {
          student: studentId,
          status: statusMap[String(studentId)] || STATUS.PRESENT,
        };
      })
      .filter(Boolean);

    if (!records.length) return;

    const payload = {
      classId,
      date,
      records,
    };

    const options = {
      onSuccess: () => {
        refetch();
      },
    };

    if (existing) {
      updateAttendance(payload, options);
    } else {
      markAttendance(payload, options);
    }
  };

  /* ======================================================
     REFRESH
  ====================================================== */

  const handleRefresh = () => {
    refetch();
    refetchAssignments();
  };

  /* ======================================================
     LOADING
  ====================================================== */

  const dataLoading =
    assignmentsLoading || studentsLoading || attendanceLoading;

  const isRefreshing =
    assignmentsFetching || attendanceFetching || studentsFetching;

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: T.bg,
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, md: 3 },
      }}
    >
      <Box sx={{ maxWidth: 1440, mx: "auto" }}>
        {/* ==================================================
            HEADER
        ================================================== */}

        <Box
          sx={{
            mb: 2.5,
            display: "flex",
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`,
                boxShadow: `0 4px 12px ${T.primary}33`,
              }}
            >
              <Groups sx={{ color: "#fff", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: { xs: 19, md: 22 },
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: T.textPrimary,
                }}
              >
                Attendance
              </Typography>
              <Typography variant="caption" sx={{ color: T.textSecondary }}>
                Mark and manage daily attendance for your assigned classes
              </Typography>
            </Box>
          </Stack>

          <Button
            size="small"
            variant="outlined"
            startIcon={
              <Refresh
                sx={{
                  animation: isRefreshing
                    ? "attendanceSpin 1s linear infinite"
                    : "none",
                  "@keyframes attendanceSpin": {
                    from: { transform: "rotate(0deg)" },
                    to: { transform: "rotate(360deg)" },
                  },
                }}
              />
            }
            onClick={handleRefresh}
            disabled={isRefreshing}
            sx={{
              minHeight: 38,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              color: T.primary,
              borderColor: T.border,
              bgcolor: T.surface,
              "&:hover": {
                borderColor: T.primary,
                bgcolor: T.primarySoft,
              },
            }}
          >
            Refresh
          </Button>
        </Box>

        {/* ==================================================
            NO ASSIGNMENT
        ================================================== */}

        {!assignmentsLoading && assignedClasses.length === 0 && (
          <Alert
            severity="info"
            sx={{
              borderRadius: 2,
              py: 1,
              bgcolor: T.primarySoft,
              color: T.primaryDark,
              "& .MuiAlert-icon": { color: T.primary },
            }}
          >
            No active class assignments are available for your account.
          </Alert>
        )}

        {assignedClasses.length > 0 && (
          <>
            {/* ==================================================
                CONTROL BAR
            ================================================== */}

            <Paper
              elevation={0}
              sx={{
                mb: 2,
                border: `1px solid ${T.border}`,
                borderRadius: 3,
                bgcolor: T.surface,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  flexWrap: "wrap",
                }}
              >
                {/* CLASS */}

                <TextField
                  select
                  size="small"
                  label="Class"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  sx={{ minWidth: { xs: "100%", sm: 190 } }}
                  disabled={assignmentsLoading}
                >
                  {assignedClasses.map((item) => (
                    <MenuItem key={item._id} value={item._id}>
                      {item.className}
                      {item.section ? ` - ${item.section}` : ""}
                    </MenuItem>
                  ))}
                </TextField>

                {/* DATE */}

                <TextField
                  size="small"
                  type="date"
                  label="Date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: { xs: "100%", sm: 165 } }}
                />

                {/* SEARCH */}

                <TextField
                  size="small"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email or roll no."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" sx={{ color: T.textSecondary }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ flex: 1, minWidth: { xs: "100%", sm: 240 } }}
                />

                {/* CLEAR */}

                {(search || statusFilter !== STATUS.ALL) && (
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<FilterAltOff fontSize="small" />}
                    onClick={clearFilters}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      color: T.textSecondary,
                    }}
                  >
                    Clear
                  </Button>
                )}
              </Box>

              <Divider sx={{ borderColor: T.border }} />

              {/* QUICK ACTIONS */}

              <Box
                sx={{
                  px: 2,
                  py: 1.25,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.9,
                  flexWrap: "wrap",
                  bgcolor: T.primarySoft,
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={700}
                  sx={{ mr: 0.5, color: T.primaryDark, letterSpacing: "0.3px" }}
                >
                  MARK ALL AS
                </Typography>

                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DoneAll fontSize="small" />}
                  onClick={() => markAll(STATUS.PRESENT)}
                  sx={{
                    minHeight: 30,
                    borderRadius: 1.75,
                    textTransform: "none",
                    fontWeight: 600,
                    bgcolor: T.surface,
                    borderColor: T.successSoft,
                    color: T.success,
                    "&:hover": { borderColor: T.success, bgcolor: T.successSoft },
                  }}
                >
                  Present
                </Button>

                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => markAll(STATUS.ABSENT)}
                  sx={{
                    minHeight: 30,
                    borderRadius: 1.75,
                    textTransform: "none",
                    fontWeight: 600,
                    bgcolor: T.surface,
                    borderColor: T.errorSoft,
                    color: T.error,
                    "&:hover": { borderColor: T.error, bgcolor: T.errorSoft },
                  }}
                >
                  Absent
                </Button>

                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => markAll(STATUS.LEAVE)}
                  sx={{
                    minHeight: 30,
                    borderRadius: 1.75,
                    textTransform: "none",
                    fontWeight: 600,
                    bgcolor: T.surface,
                    borderColor: T.warningSoft,
                    color: T.warning,
                    "&:hover": { borderColor: T.warning, bgcolor: T.warningSoft },
                  }}
                >
                  Leave
                </Button>

                <Box
                  sx={{
                    ml: { xs: 0, sm: "auto" },
                    display: "flex",
                    gap: 0.6,
                    flexWrap: "wrap",
                  }}
                >
                  {[
                    { key: STATUS.ALL, label: `All ${counts.total}` },
                    { key: STATUS.PRESENT, label: `Present ${counts.present}` },
                    { key: STATUS.ABSENT, label: `Absent ${counts.absent}` },
                    { key: STATUS.LEAVE, label: `Leave ${counts.leave}` },
                  ].map((item) => {
                    const active = statusFilter === item.key;
                    return (
                      <Chip
                        key={item.key}
                        size="small"
                        label={item.label}
                        onClick={() => setStatusFilter(item.key)}
                        clickable
                        sx={{
                          fontWeight: 700,
                          color: active ? "#fff" : T.primaryDark,
                          bgcolor: active ? T.primary : T.surface,
                          border: `1px solid ${active ? T.primary : T.border}`,
                          "&:hover": {
                            bgcolor: active ? T.primaryDark : T.primarySoft,
                          },
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>
            </Paper>

            {/* ==================================================
                COMPACT SUMMARY
            ================================================== */}
{/* 
            {classId && (
              <Grid container spacing={1.25} sx={{ mb: 2 }}>
                <Grid item xs={6} sm={3}>
                  <MiniStat
                    label="Students"
                    value={counts.total}
                    icon={<Groups />}
                    accent={T.primary}
                    accentSoft={T.primarySoft}
                  />
                </Grid>

                <Grid item xs={6} sm={3}>
                  <MiniStat
                    label="Present"
                    value={counts.present}
                    icon={<CheckCircle />}
                    accent={T.success}
                    accentSoft={T.successSoft}
                  />
                </Grid>

                <Grid item xs={6} sm={3}>
                  <MiniStat
                    label="Absent"
                    value={counts.absent}
                    icon={<Cancel />}
                    accent={T.error}
                    accentSoft={T.errorSoft}
                  />
                </Grid>

                <Grid item xs={6} sm={3}>
                  <MiniStat
                    label="Leave"
                    value={counts.leave}
                    icon={<EventBusy />}
                    accent={T.warning}
                    accentSoft={T.warningSoft}
                  />
                </Grid>
              </Grid>
            )} */}

            {/* ==================================================
                LOADING
            ================================================== */}

            {classId && dataLoading && (
              <Paper
                elevation={0}
                sx={{
                  border: `1px solid ${T.border}`,
                  borderRadius: 3,
                  bgcolor: T.surface,
                  py: 6,
                  textAlign: "center",
                }}
              >
                <CircularProgress size={28} sx={{ color: T.primary }} />
                <Typography sx={{ mt: 1.5, color: T.textPrimary }} fontWeight={600}>
                  Loading attendance
                </Typography>
                <Typography variant="caption" sx={{ color: T.textSecondary }}>
                  Fetching students and attendance data...
                </Typography>
              </Paper>
            )}

            {/* ==================================================
                ATTENDANCE TABLE
            ================================================== */}

            {classId && !dataLoading && (
              <Paper
                elevation={0}
                sx={{
                  border: `1px solid ${T.border}`,
                  borderRadius: 3,
                  overflow: "hidden",
                  bgcolor: T.surface,
                }}
              >
                {/* TABLE HEADER */}
<Box
  sx={{
    px: 2,
    py: 1.25,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 1,
    flexWrap: "wrap",
    bgcolor: "#4C1D95",
    borderBottom: "1px solid #5B21B6",
  }}
>
  <Box sx={{ minWidth: 0 }}>
    <Typography
      variant="caption"
      sx={{
        color: "#FFFFFF",
        fontWeight: 600,
      }}
    >
      {formatDate(date)}
      {existing ? " • Already saved" : " • Not saved yet"}
    </Typography>
  </Box>

  <Chip
    size="small"
    label={`${filteredStudents.length}/${counts.total} students`}
    sx={{
      height: 28,
      fontWeight: 700,
      color: "#FFFFFF",
      bgcolor: "#6D28D9",
      border: "1px solid #8B5CF6",
      borderRadius: 1.5,
    }}
  />
</Box>

                <Divider sx={{ borderColor: T.border }} />

                {/* EMPTY */}

                {!filteredStudents.length ? (
                  <Box sx={{ py: 7, px: 2, textAlign: "center" }}>
                    <Search sx={{ fontSize: 36, color: T.border }} />
                    <Typography fontWeight={700} sx={{ mt: 0.5, color: T.textPrimary }}>
                      No students found
                    </Typography>
                    <Typography variant="caption" sx={{ color: T.textSecondary }}>
                      Try another search term or status filter.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ overflowX: "auto" }}>
                    <Box sx={{ minWidth: 760 }}>
                      {/* COLUMN HEADER */}

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns:
                            "45px 80px minmax(200px, 1fr) 105px 290px",
                          gap: 1,
                          alignItems: "center",
                          px: 2,
                          py: 1,
                          bgcolor: T.bg,
                          borderBottom: `1px solid ${T.border}`,
                        }}
                      >
                        <HeaderCell>#</HeaderCell>
                        <HeaderCell>Roll</HeaderCell>
                        <HeaderCell>Student</HeaderCell>
                        <HeaderCell>Status</HeaderCell>
                        <HeaderCell>Attendance</HeaderCell>
                      </Box>

                      {/* STUDENTS */}

                      {filteredStudents.map((student, index) => {
                        const studentId = student?.user?._id;

                        const currentStatus =
                          statusMap[String(studentId)] || STATUS.PRESENT;

                        const studentName = student?.user?.name || "-";
                        const email = student?.user?.email || "";

                        return (
                          <Box
                            key={studentId || index}
                            sx={{
                              display: "grid",
                              gridTemplateColumns:
                                "45px 80px minmax(200px, 1fr) 105px 290px",
                              gap: 1,
                              alignItems: "center",
                              px: 2,
                              py: 1,
                              minHeight: 58,
                              borderBottom: `1px solid ${T.border}`,
                              "&:hover": { bgcolor: T.primarySoft },
                              transition: "background-color 0.15s ease",
                            }}
                          >
                            {/* INDEX */}
                            <Typography variant="caption" fontWeight={600} sx={{ color: T.textSecondary }}>
                              {index + 1}
                            </Typography>

                            {/* ROLL */}
                            <Typography variant="body2" fontWeight={700} sx={{ color: T.textPrimary }}>
                              {student?.rollNumber || "-"}
                            </Typography>

                            {/* STUDENT */}
                            <Box sx={{ minWidth: 0, display: "flex", alignItems: "center", gap: 1.25 }}>
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  flexShrink: 0,
                                  borderRadius: "50%",
                                  background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`,
                                  color: "#fff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 12,
                                  fontWeight: 700,
                                }}
                              >
                                {studentName.charAt(0).toUpperCase()}
                              </Box>

                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" fontWeight={600} noWrap sx={{ color: T.textPrimary }}>
                                  {studentName}
                                </Typography>

                                {email && (
                                  <Typography
                                    variant="caption"
                                    noWrap
                                    sx={{ display: "block", lineHeight: 1.2, color: T.textSecondary }}
                                  >
                                    {email}
                                  </Typography>
                                )}
                              </Box>
                            </Box>

                            {/* STATUS */}
                            <Chip
                              size="small"
                              label={getStatusLabel(currentStatus)}
                              sx={{
                                width: "fit-content",
                                height: 24,
                                fontSize: 11,
                                fontWeight: 700,
                                color: STATUS_STYLES[currentStatus]?.color,
                                bgcolor: STATUS_STYLES[currentStatus]?.bg,
                              }}
                            />

                            {/* CONTROL */}
                            <ToggleButtonGroup
                              size="small"
                              exclusive
                              value={currentStatus}
                              onChange={(e, value) =>
                                handleStatusChange(studentId, value)
                              }
                              sx={{
                                bgcolor: T.bg,
                                borderRadius: 1.75,
                                p: 0.3,
                                gap: 0.3,
                                "& .MuiToggleButtonGroup-grouped": {
                                  border: "none",
                                  borderRadius: "10px !important",
                                },
                              }}
                            >
                              <ToggleButton
                                value={STATUS.PRESENT}
                                sx={{
                                  px: 1.1,
                                  py: 0.3,
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  textTransform: "none",
                                  color: T.success,
                                  "&.Mui-selected": {
                                    color: "#fff",
                                    bgcolor: T.success,
                                    "&:hover": { bgcolor: T.success },
                                  },
                                }}
                              >
                                Present
                              </ToggleButton>
                              <ToggleButton
                                value={STATUS.ABSENT}
                                sx={{
                                  px: 1.1,
                                  py: 0.3,
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  textTransform: "none",
                                  color: T.error,
                                  "&.Mui-selected": {
                                    color: "#fff",
                                    bgcolor: T.error,
                                    "&:hover": { bgcolor: T.error },
                                  },
                                }}
                              >
                                Absent
                              </ToggleButton>
                              <ToggleButton
                                value={STATUS.LEAVE}
                                sx={{
                                  px: 1.1,
                                  py: 0.3,
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  textTransform: "none",
                                  color: T.warning,
                                  "&.Mui-selected": {
                                    color: "#fff",
                                    bgcolor: T.warning,
                                    "&:hover": { bgcolor: T.warning },
                                  },
                                }}
                              >
                                Leave
                              </ToggleButton>
                            </ToggleButtonGroup>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}

                {/* ==================================================
                    SAVE FOOTER
                ================================================== */}

                {classStudents.length > 0 && (
                  <>
                    <Divider sx={{ borderColor: T.border }} />

                    <Box
                      sx={{
                        px: 2,
                        py: 1.25,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1.5,
                        flexWrap: "wrap",
                        bgcolor: T.bg,
                        position: "sticky",
                        bottom: 0,
                        zIndex: 5,
                      }}
                    >
                      <Box>
                        <Typography variant="caption" fontWeight={700} sx={{ color: T.textPrimary }}>
                          {counts.present} Present • {counts.absent} Absent •{" "}
                          {counts.leave} Leave
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{ display: "block", color: T.textSecondary }}
                        >
                          {existing
                            ? "Existing attendance will be updated."
                            : "Review and save today's attendance."}
                        </Typography>
                      </Box>

                      <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={saving}
                        startIcon={
                          saving ? (
                            <CircularProgress size={17} color="inherit" />
                          ) : (
                            <Save />
                          )
                        }
                        sx={{
                          minWidth: 150,
                          minHeight: 22,
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 700,
                          boxShadow: "none",
                          bgcolor: T.primary,
                          "&:hover": {
                            bgcolor: T.primaryDark,
                            boxShadow: `0 6px 16px ${T.primary}40`,
                          },
                        }}
                      >
                        {saving
                          ? "Saving..."
                          : existing
                          ? "Update Attendance"
                          : "Save Attendance"}
                      </Button>
                    </Box>
                  </>
                )}
              </Paper>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}

/* ======================================================
   HEADER CELL
====================================================== */

function HeaderCell({ children }) {
  return (
    <Typography
      variant="caption"
      fontWeight={700}
      sx={{
        textTransform: "uppercase",
        fontSize: 10.5,
        letterSpacing: "0.5px",
        color: T.textSecondary,
      }}
    >
      {children}
    </Typography>
  );
}

/* ======================================================
   MINI STAT
====================================================== */

function MiniStat({ label, value, icon, accent, accentSoft }) {
  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${T.border}`,
        borderRadius: 2.5,
        bgcolor: T.surface,
      }}
    >
      <CardContent
        sx={{
          p: { xs: 1.25, sm: 1.5 },
          "&:last-child": { pb: { xs: 1.25, sm: 1.5 } },
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Box>
            <Typography variant="caption" fontWeight={600} sx={{ color: T.textSecondary }}>
              {label}
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: 20, sm: 22 },
                lineHeight: 1.1,
                fontWeight: 700,
                mt: 0.25,
                color: T.textPrimary,
              }}
            >
              {value}
            </Typography>
          </Box>

          <Box
            sx={{
              width: 34,
              height: 34,
              flexShrink: 0,
              borderRadius: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accent,
              bgcolor: accentSoft,
              "& svg": { fontSize: 19 },
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

/* ======================================================
   PAGE
====================================================== */

export default function TeacherAttendancePage() {
  return (
    <PortalGuard allowedRoles={["TEACHER"]}>
      <TeacherAttendanceContent />
    </PortalGuard>
  );
}