"use client";

import { useEffect, useMemo, useState } from "react";

import StudentAttendanceDownload from "@/components/website/student/StudentAttendanceDownload";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  Search,
  Download,
  Person,
  CheckCircle,
  Cancel,
  EventBusy,
  Refresh,
  FilterAltOff,
} from "@mui/icons-material";

import * as XLSX from "xlsx";

import { useClasses } from "@/hooks/useClasses";

import { useStudentsByClass } from "@/hooks/useStudent";

import {
  useClassAttendance,
  useMarkAttendance,
  useUpdateAttendance,
} from "@/hooks/useAttendance";

// ======================================================
// CONSTANTS
// ======================================================

const STATUS = {
  ALL: "ALL",
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  LEAVE: "LEAVE",
};

// ======================================================
// HELPERS
// ======================================================

const formatDate = (date) => {
  if (!date) return "";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getStatusText = (status) => {
  switch (status) {
    case STATUS.PRESENT:
      return "Present";

    case STATUS.ABSENT:
      return "Absent";

    case STATUS.LEAVE:
      return "Leave";

    default:
      return "-";
  }
};

// ======================================================
// MAIN
// ======================================================

export default function AttendancePage() {
  // ====================================================
  // STATE
  // ====================================================

  const [classId, setClassId] = useState("");

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [statusMap, setStatusMap] = useState({});

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState(STATUS.ALL);

  // ====================================================
  // CLASSES
  // ====================================================

  const { data: classes = [], isLoading: classesLoading } = useClasses();

  // ====================================================
  // STUDENTS
  // ====================================================

  const {
    data: classStudents = [],
    isLoading: studentsLoading,
    isFetching: studentsFetching,
  } = useStudentsByClass(classId);

  // ====================================================
  // EXISTING ATTENDANCE
  // ====================================================

  const {
    data: existing,
    isLoading: attendanceLoading,
    isFetching: attendanceFetching,
    refetch,
  } = useClassAttendance(classId, date);

  // ====================================================
  // MUTATIONS
  // ====================================================

  const { mutate: markAttendance, isPending: marking } = useMarkAttendance();

  const { mutate: updateAttendance, isPending: updating } =
    useUpdateAttendance();

  // ====================================================
  // SELECTED CLASS
  // ====================================================

  const selectedClass = useMemo(
    () => classes.find((item) => item._id === classId),
    [classes, classId],
  );

  // ====================================================
  // INITIALIZE STATUS
  // ====================================================

  useEffect(() => {
    if (!classStudents.length) {
      setStatusMap({});
      return;
    }

    const map = {};

    classStudents.forEach((student) => {
      const studentId = student?.user?._id;

      if (studentId) {
        map[studentId] = "PRESENT";
      }
    });

    if (existing?.records?.length) {
      existing.records.forEach((record) => {
        const studentId = record?.student?._id || record?.student;

        if (studentId) {
          map[studentId] = record.status;
        }
      });
    }

    setStatusMap(map);
  }, [classStudents, existing]);

  // ====================================================
  // STATUS CHANGE
  // ====================================================

  const handleStatusChange = (studentId, status) => {
    setStatusMap((previous) => ({
      ...previous,

      [studentId]: status,
    }));
  };

  // ====================================================
  // COUNTS
  // ====================================================

  const counts = useMemo(() => {
    const values = Object.values(statusMap);

    return {
      total: classStudents.length,

      present: values.filter((status) => status === STATUS.PRESENT).length,

      absent: values.filter((status) => status === STATUS.ABSENT).length,

      leave: values.filter((status) => status === STATUS.LEAVE).length,
    };
  }, [statusMap, classStudents]);

  // ====================================================
  // FILTER
  // ====================================================

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return classStudents.filter((student) => {
      const studentId = student?.user?._id;

      const name = student?.user?.name || "";

      const email = student?.user?.email || "";

      const roll = String(student?.rollNumber || "");

      const currentStatus = statusMap[studentId] || STATUS.PRESENT;

      // SEARCH
      const searchMatched =
        !query ||
        name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        roll.toLowerCase().includes(query);

      // STATUS
      const statusMatched =
        statusFilter === STATUS.ALL || currentStatus === statusFilter;

      return searchMatched && statusMatched;
    });
  }, [classStudents, search, statusFilter, statusMap]);

  // ====================================================
  // RESET FILTERS
  // ====================================================

  const clearFilters = () => {
    setSearch("");
    setStatusFilter(STATUS.ALL);
  };

  // ====================================================
  // SUBMIT
  // ====================================================

  const handleSubmit = () => {
    if (!classId) {
      return;
    }

    if (!classStudents.length) {
      return;
    }

    const records = classStudents.map((student) => {
      const studentId = student?.user?._id;

      return {
        student: studentId,

        status: statusMap[studentId] || STATUS.PRESENT,
      };
    });

    const payload = {
      classId,
      date,
      records,
    };

    if (existing) {
      updateAttendance(payload, {
        onSuccess: () => {
          refetch();
        },
      });
    } else {
      markAttendance(payload, {
        onSuccess: () => {
          refetch();
        },
      });
    }
  };

  // ====================================================
  // EXCEL - CLASS
  // ====================================================

  const downloadClassExcel = () => {
    if (!classStudents.length) {
      return;
    }

    const rows = classStudents.map((student, index) => {
      const studentId = student?.user?._id;

      return {
        "S.No": index + 1,

        "Roll No": student?.rollNumber || "",

        "Student Name": student?.user?.name || "",

        Email: student?.user?.email || "",

        Class: selectedClass?.className || "",

        Section: selectedClass?.section || "",

        Date: formatDate(date),

        Status: getStatusText(statusMap[studentId] || STATUS.PRESENT),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 25 },
      { wch: 32 },
      { wch: 18 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    const className = selectedClass?.className || "Class";

    XLSX.writeFile(workbook, `Attendance_${className}_${date}.xlsx`);
  };

  // ====================================================
  // EXCEL - FILTERED
  // ====================================================

  const downloadFilteredExcel = () => {
    if (!filteredStudents.length) {
      return;
    }

    const rows = filteredStudents.map((student, index) => {
      const studentId = student?.user?._id;

      return {
        "S.No": index + 1,

        "Roll No": student?.rollNumber || "",

        "Student Name": student?.user?.name || "",

        Email: student?.user?.email || "",

        Class: selectedClass?.className || "",

        Section: selectedClass?.section || "",

        Date: formatDate(date),

        Status: getStatusText(statusMap[studentId] || STATUS.PRESENT),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 25 },
      { wch: 32 },
      { wch: 18 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Attendance");

    XLSX.writeFile(workbook, `Filtered_Attendance_${date}.xlsx`);
  };

  // ====================================================
  // LOADING
  // ====================================================

  const pageLoading = studentsLoading || attendanceLoading;

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <Box
      sx={{
        p: {
          xs: 1.5,
          sm: 2,
          md: 3,
        },

        maxWidth: 1600,

        mx: "auto",
      }}
    >
      {/* ================================================
          HEADER
      ================================================ */}

      <Box
        sx={{
          mb: 3,

          display: "flex",

          alignItems: {
            xs: "flex-start",
            md: "center",
          },

          justifyContent: "space-between",

          flexDirection: {
            xs: "column",
            md: "row",
          },

          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{
              letterSpacing: "-0.02em",
            }}
          >
            Attendance
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage and track daily student attendance
          </Typography>
        </Box>

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={1}
          width={{
            xs: "100%",
            md: "auto",
          }}
        >
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Download />}
            onClick={downloadFilteredExcel}
            disabled={!filteredStudents.length}
            sx={{
              textTransform: "none",
              minWidth: 160,
            }}
          >
            Filtered Excel
          </Button>

          <Button
            fullWidth
            variant="contained"
            startIcon={<Download />}
            onClick={downloadClassExcel}
            disabled={!classStudents.length}
            sx={{
              textTransform: "none",
              minWidth: 160,
            }}
          >
            Download Excel
          </Button>
        </Stack>
      </Box>

      {/* ================================================
          FILTER PANEL
      ================================================ */}

      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",

          borderRadius: 2,

          p: {
            xs: 1.5,
            md: 2,
          },

          mb: 3,
        }}
      >
        <Typography fontWeight={600} sx={{ mb: 1.5 }}>
          Attendance Filters
        </Typography>

        <Grid container spacing={2}>
          {/* CLASS */}

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <Select
                displayEmpty
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                disabled={classesLoading}
              >
                <MenuItem value="" disabled>
                  Select Class
                </MenuItem>

                {classes.map((item) => (
                  <MenuItem key={item._id} value={item._id}>
                    {item.className}
                    {" - "}
                    {item.section}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* DATE */}

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          {/* SEARCH */}

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, roll no or email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* RESET */}

          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterAltOff />}
              onClick={clearFilters}
              disabled={!search && statusFilter === STATUS.ALL}
              sx={{
                height: 40,
                textTransform: "none",
              }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* STATUS FILTER */}

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip
            label={`All (${counts.total})`}
            clickable
            color={statusFilter === STATUS.ALL ? "primary" : "default"}
            onClick={() => setStatusFilter(STATUS.ALL)}
          />

          <Chip
            label={`Present (${counts.present})`}
            clickable
            color={statusFilter === STATUS.PRESENT ? "success" : "default"}
            onClick={() => setStatusFilter(STATUS.PRESENT)}
          />

          <Chip
            label={`Absent (${counts.absent})`}
            clickable
            color={statusFilter === STATUS.ABSENT ? "error" : "default"}
            onClick={() => setStatusFilter(STATUS.ABSENT)}
          />

          <Chip
            label={`Leave (${counts.leave})`}
            clickable
            color={statusFilter === STATUS.LEAVE ? "warning" : "default"}
            onClick={() => setStatusFilter(STATUS.LEAVE)}
          />
        </Stack>
      </Paper>

      {/* ================================================
          SUMMARY
      ================================================ */}

      {classId && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <SummaryCard
              title="Total Students"
              value={counts.total}
              icon={<Person />}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <SummaryCard
              title="Present"
              value={counts.present}
              icon={<CheckCircle />}
              color="success"
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <SummaryCard
              title="Absent"
              value={counts.absent}
              icon={<Cancel />}
              color="error"
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <SummaryCard
              title="Leave"
              value={counts.leave}
              icon={<EventBusy />}
              color="warning"
            />
          </Grid>
        </Grid>
      )}

      {/* ================================================
          NO CLASS
      ================================================ */}

      {!classId && (
        <Alert
          severity="info"
          sx={{
            borderRadius: 2,
          }}
        >
          Select a class to start managing attendance.
        </Alert>
      )}

      {/* ================================================
          LOADING
      ================================================ */}

      {classId && pageLoading && (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",

            border: "1px solid",

            borderColor: "divider",

            borderRadius: 2,
          }}
        >
          <CircularProgress />

          <Typography
            sx={{
              mt: 2,
            }}
            color="text.secondary"
          >
            Loading students and attendance...
          </Typography>
        </Paper>
      )}

      {/* ================================================
          STUDENT TABLE
      ================================================ */}

      {classId && !pageLoading && (
        <Paper
          elevation={0}
          sx={{
            border: "1px solid",

            borderColor: "divider",

            borderRadius: 2,

            overflow: "hidden",
          }}
        >
          {/* TABLE HEADER */}

          <Box
            sx={{
              p: 2,

              display: "flex",

              justifyContent: "space-between",

              alignItems: "center",

              gap: 2,

              flexWrap: "wrap",
            }}
          >
            <Box>
              <Typography fontWeight={700}>Student Attendance</Typography>

              <Typography variant="body2" color="text.secondary">
                {selectedClass?.className || "Class"}{" "}
                {selectedClass?.section ? `- ${selectedClass.section}` : ""} •{" "}
                {formatDate(date)}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <Chip
                size="small"
                label={`${filteredStudents.length} Students`}
              />

              <Button
                size="small"
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => refetch()}
                disabled={attendanceFetching || studentsFetching}
                sx={{
                  textTransform: "none",
                }}
              >
                Refresh
              </Button>
            </Stack>
          </Box>

          <Divider />

          {/* EMPTY */}

          {!filteredStudents.length ? (
            <Box
              sx={{
                p: 6,
                textAlign: "center",
              }}
            >
              <Typography fontWeight={600}>No students found</Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                }}
              >
                Try changing the search or status filter.
              </Typography>
            </Box>
          ) : (
            <TableContainer
              sx={{
                maxHeight: 620,
              }}
            >
              <Table
                stickyHeader
                size="small"
                sx={{
                  minWidth: 1050,
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      S.No
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Roll No
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Student
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Email
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 700,
                        minWidth: 350,
                      }}
                    >
                      Attendance
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 700,
                        position: "sticky",
                        right: 0,
                        zIndex: 3,
                        backgroundColor: "background.paper",
                      }}
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredStudents.map((student, index) => {
                    const studentId = student?.user?._id;

                    const currentStatus =
                      statusMap[studentId] || STATUS.PRESENT;

                    return (
                      <TableRow key={studentId} hover>
                        <TableCell>{index + 1}</TableCell>

                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {student?.rollNumber || "-"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {student?.user?.name || "-"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {student?.user?.email || "-"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <RadioGroup
                            row
                            value={currentStatus}
                            onChange={(e) =>
                              handleStatusChange(studentId, e.target.value)
                            }
                            sx={{
                              flexWrap: "nowrap",
                            }}
                          >
                            <FormControlLabel
                              value={STATUS.PRESENT}
                              control={<Radio size="small" color="success" />}
                              label={
                                <Typography variant="body2">Present</Typography>
                              }
                            />

                            <FormControlLabel
                              value={STATUS.ABSENT}
                              control={<Radio size="small" color="error" />}
                              label={
                                <Typography variant="body2">Absent</Typography>
                              }
                            />

                            <FormControlLabel
                              value={STATUS.LEAVE}
                              control={<Radio size="small" color="warning" />}
                              label={
                                <Typography variant="body2">Leave</Typography>
                              }
                            />
                          </RadioGroup>
                        </TableCell>

                        <TableCell
                          sx={{
                            position: "sticky",
                            right: 0,
                            backgroundColor: "background.paper",
                            zIndex: 1,
                          }}
                        >
                          <StudentAttendanceDownload
                            student={student}
                            classId={classId}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* =========================================
                SAVE BAR
            ========================================= */}

          {classStudents.length > 0 && (
            <Box
              sx={{
                p: 2,

                borderTop: "1px solid",

                borderColor: "divider",

                display: "flex",

                justifyContent: "flex-end",

                backgroundColor: "background.paper",

                position: "sticky",

                bottom: 0,

                zIndex: 4,
              }}
            >
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={marking || updating}
                sx={{
                  minWidth: 180,
                  textTransform: "none",
                }}
              >
                {marking || updating ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={18} color="inherit" />

                    <span>Saving...</span>
                  </Stack>
                ) : existing ? (
                  "Update Attendance"
                ) : (
                  "Mark Attendance"
                )}
              </Button>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}

// ======================================================
// SUMMARY CARD
// ======================================================

function SummaryCard({ title, value, icon, color }) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",

        border: "1px solid",

        borderColor: "divider",

        borderRadius: 2,
      }}
    >
      <CardContent
        sx={{
          p: {
            xs: 1.5,
            md: 2,
          },

          "&:last-child": {
            pb: {
              xs: 1.5,
              md: 2,
            },
          },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={1}
        >
          <Box>
            <Typography variant="body2" color="text.secondary" noWrap>
              {title}
            </Typography>

            <Typography
              variant="h5"
              fontWeight={700}
              sx={{
                mt: 0.5,
              }}
            >
              {value}
            </Typography>
          </Box>

          <Box
            sx={{
              width: 42,
              height: 42,

              borderRadius: "50%",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              color: color ? `${color}.main` : "primary.main",

              backgroundColor: color ? `${color}.lighter` : "action.hover",

              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
