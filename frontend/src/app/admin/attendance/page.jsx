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
    month: "short",
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

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [statusMap, setStatusMap] = useState({});

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState(STATUS.ALL);

  // ====================================================
  // CLASSES
  // ====================================================

  const {
    data: classes = [],
    isLoading: classesLoading,
  } = useClasses();

  // ====================================================
  // STUDENTS
  // ====================================================

  const {
    data: studentsData,
    isLoading: studentsLoading,
    isFetching: studentsFetching,
  } = useStudentsByClass(classId);

  const classStudents = Array.isArray(studentsData?.students)
    ? studentsData.students
    : [];

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

  const {
    mutate: markAttendance,
    isPending: marking,
  } = useMarkAttendance();

  const {
    mutate: updateAttendance,
    isPending: updating,
  } = useUpdateAttendance();

  // ====================================================
  // SELECTED CLASS
  // ====================================================

  const selectedClass = useMemo(
    () => classes.find((item) => item._id === classId),
    [classes, classId]
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
        map[studentId] = STATUS.PRESENT;
      }
    });

    if (existing?.records?.length) {
      existing.records.forEach((record) => {
        const studentId =
          record?.student?._id || record?.student;

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

      present: values.filter(
        (status) => status === STATUS.PRESENT
      ).length,

      absent: values.filter(
        (status) => status === STATUS.ABSENT
      ).length,

      leave: values.filter(
        (status) => status === STATUS.LEAVE
      ).length,
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

      const currentStatus =
        statusMap[studentId] || STATUS.PRESENT;

      const searchMatched =
        !query ||
        name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        roll.toLowerCase().includes(query);

      const statusMatched =
        statusFilter === STATUS.ALL ||
        currentStatus === statusFilter;

      return searchMatched && statusMatched;
    });
  }, [
    classStudents,
    search,
    statusFilter,
    statusMap,
  ]);

  // ====================================================
  // RESET
  // ====================================================

  const clearFilters = () => {
    setSearch("");
    setStatusFilter(STATUS.ALL);
  };

  // ====================================================
  // SUBMIT
  // ====================================================

  const handleSubmit = () => {
    if (!classId || !classStudents.length) {
      return;
    }

    const records = classStudents.map((student) => {
      const studentId = student?.user?._id;

      return {
        student: studentId,
        status:
          statusMap[studentId] || STATUS.PRESENT,
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
  // EXCEL
  // ====================================================

  const downloadClassExcel = () => {
    if (!classStudents.length) return;

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
        Status: getStatusText(
          statusMap[studentId] || STATUS.PRESENT
        ),
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

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Attendance"
    );

    const className =
      selectedClass?.className || "Class";

    XLSX.writeFile(
      workbook,
      `Attendance_${className}_${date}.xlsx`
    );
  };

  const downloadFilteredExcel = () => {
    if (!filteredStudents.length) return;

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
        Status: getStatusText(
          statusMap[studentId] || STATUS.PRESENT
        ),
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

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Filtered Attendance"
    );

    XLSX.writeFile(
      workbook,
      `Filtered_Attendance_${date}.xlsx`
    );
  };

  // ====================================================
  // LOADING
  // ====================================================

  const pageLoading =
    studentsLoading || attendanceLoading;

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <Box
      sx={{
        p: {
          xs: 1,
          sm: 1,
          md: 0.5,
        },

        maxWidth: 1600,
        mx: "auto",

        bgcolor: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* ==================================================
          TOP HEADER
      ================================================== */}

      <Paper
        elevation={0}
        sx={{
          px: {
            xs: 1.25,
            sm: 1.5,
            md: 2,
          },

          py: {
            xs: 1,
            md: 1.25,
          },

          mb: 1.25,

          borderRadius: 1.5,

          border: "1px solid #e2e8f0",

          bgcolor: "#ffffff",
        }}
      >
        <Stack
          direction={{
            xs: "column",
            lg: "row",
          }}
          alignItems={{
            xs: "stretch",
            lg: "center",
          }}
          justifyContent="space-between"
          spacing={1.25}
        >
          {/* TITLE */}

          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            flexShrink={0}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1,
                bgcolor: "#ede9fe",
                color: "#4f1da5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle sx={{ fontSize: 19 }} />
            </Box>

            <Box>
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.75}
              >
                <Typography
                  sx={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  Attendance
                </Typography>

                {classId && (
                  <Chip
                    size="small"
                    label={`${counts.total} Students`}
                    sx={{
                      height: 21,
                      fontSize: 10,
                      fontWeight: 700,
                      bgcolor: "#f1f5f9",
                    }}
                  />
                )}
              </Stack>

              <Typography
                sx={{
                  fontSize: 10.5,
                  color: "#64748b",
                  mt: 0.15,
                }}
              >
                Daily student attendance
              </Typography>
            </Box>
          </Stack>

          {/* ACTIONS */}

          <Stack
            direction="row"
            spacing={0.75}
            justifyContent={{
              xs: "stretch",
              lg: "flex-end",
            }}
          >
            <Button
              size="small"
              variant="outlined"
              startIcon={<Download sx={{ fontSize: 16 }} />}
              onClick={downloadFilteredExcel}
              disabled={!filteredStudents.length}
              sx={{
                height: 34,
                px: 1.25,
                borderRadius: 1,
                textTransform: "none",
                fontSize: 11,
                fontWeight: 700,
                flex: {
                  xs: 1,
                  lg: "unset",
                },
              }}
            >
              Filtered
            </Button>

            <Button
              size="small"
              variant="contained"
              startIcon={<Download sx={{ fontSize: 16 }} />}
              onClick={downloadClassExcel}
              disabled={!classStudents.length}
              sx={{
                height: 34,
                px: 1.25,
                borderRadius: 1,
                textTransform: "none",
                fontSize: 11,
                fontWeight: 700,
                boxShadow: "none",
                flex: {
                  xs: 1,
                  lg: "unset",
                },
              }}
            >
              Excel
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* ==================================================
          FILTER BAR
      ================================================== */}

      <Paper
        elevation={0}
        sx={{
          border: "1px solid #e2e8f0",
          borderRadius: 1.5,
          bgcolor: "#fff",
          mb: 1.25,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            p: {
              xs: 1,
              md: 1.25,
            },
          }}
        >
          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 150px",
                md: "190px 145px minmax(220px, 1fr) auto auto",
              },

              gap: 0.75,

              alignItems: "center",
            }}
          >
            {/* CLASS */}

            <FormControl
              fullWidth
              size="small"
            >
              <Select
                displayEmpty
                value={classId}
                onChange={(e) =>
                  setClassId(e.target.value)
                }
                disabled={classesLoading}
                sx={{
                  height: 35,
                  borderRadius: 1,
                  fontSize: 11,
                  bgcolor: "#fff",
                }}
              >
                <MenuItem value="" disabled>
                  Select Class
                </MenuItem>

                {classes.map((item) => (
                  <MenuItem
                    key={item._id}
                    value={item._id}
                  >
                    {item.className} -{" "}
                    {item.section}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* DATE */}

            <TextField
              fullWidth
              size="small"
              type="date"
              value={date}
              onChange={(e) =>
                setDate(e.target.value)
              }
              InputLabelProps={{
                shrink: true,
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: 35,
                  borderRadius: 1,
                  fontSize: 11,
                },
              }}
            />

            {/* SEARCH */}

            <TextField
              fullWidth
              size="small"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search student, roll no or email..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search
                      sx={{
                        fontSize: 17,
                        color: "#94a3b8",
                      }}
                    />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: 35,
                  borderRadius: 1,
                  fontSize: 11,
                },
              }}
            />

            {/* STATUS */}

            <Box
              sx={{
                display: "flex",
                gap: 0.5,
                flexWrap: "nowrap",
                overflowX: "auto",
              }}
            >
              <StatusFilterChip
                label={`All ${counts.total}`}
                active={statusFilter === STATUS.ALL}
                onClick={() =>
                  setStatusFilter(STATUS.ALL)
                }
              />

              <StatusFilterChip
                label={`Present ${counts.present}`}
                active={
                  statusFilter === STATUS.PRESENT
                }
                type="success"
                onClick={() =>
                  setStatusFilter(STATUS.PRESENT)
                }
              />

              <StatusFilterChip
                label={`Absent ${counts.absent}`}
                active={
                  statusFilter === STATUS.ABSENT
                }
                type="error"
                onClick={() =>
                  setStatusFilter(STATUS.ABSENT)
                }
              />

              <StatusFilterChip
                label={`Leave ${counts.leave}`}
                active={
                  statusFilter === STATUS.LEAVE
                }
                type="warning"
                onClick={() =>
                  setStatusFilter(STATUS.LEAVE)
                }
              />
            </Box>

            {/* CLEAR */}

            <Button
              size="small"
              variant="text"
              startIcon={
                <FilterAltOff sx={{ fontSize: 15 }} />
              }
              onClick={clearFilters}
              disabled={
                !search &&
                statusFilter === STATUS.ALL
              }
              sx={{
                height: 35,
                px: 1,
                borderRadius: 1,
                textTransform: "none",
                fontSize: 10.5,
                whiteSpace: "nowrap",
              }}
            >
              Clear
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* ==================================================
          SUMMARY
      ================================================== */}

   {/*    {classId && (
        <Grid
          container
          spacing={0.75}
          sx={{ mb: 1.25 }}
        >
          <Grid item xs={6} sm={3}>
            <SummaryCard
              title="Total"
              value={counts.total}
              icon={<Person />}
            />
          </Grid>

          <Grid item xs={6} sm={3}>
            <SummaryCard
              title="Present"
              value={counts.present}
              icon={<CheckCircle />}
              type="success"
            />
          </Grid>

          <Grid item xs={6} sm={3}>
            <SummaryCard
              title="Absent"
              value={counts.absent}
              icon={<Cancel />}
              type="error"
            />
          </Grid>

          <Grid item xs={6} sm={3}>
            <SummaryCard
              title="Leave"
              value={counts.leave}
              icon={<EventBusy />}
              type="warning"
            />
          </Grid>
        </Grid>
      )} */}

      {/* ==================================================
          NO CLASS
      ================================================== */}

      {!classId && (
        <Alert
          severity="info"
          sx={{
            borderRadius: 1.5,
            py: 0.25,
            fontSize: 12,
          }}
        >
          Select a class to start managing attendance.
        </Alert>
      )}

      {/* ==================================================
          LOADING
      ================================================== */}

      {classId && pageLoading && (
        <Paper
          elevation={0}
          sx={{
            p: 5,
            textAlign: "center",
            border: "1px solid #e2e8f0",
            borderRadius: 1.5,
            bgcolor: "#fff",
          }}
        >
          <CircularProgress size={28} />

          <Typography
            sx={{
              mt: 1.5,
              fontSize: 12,
            }}
            color="text.secondary"
          >
            Loading students and attendance...
          </Typography>
        </Paper>
      )}

      {/* ==================================================
          TABLE
      ================================================== */}

      {classId && !pageLoading && (
        <Paper
          elevation={0}
          sx={{
            border: "1px solid #e2e8f0",
            borderRadius: 1.5,
            overflow: "hidden",
            bgcolor: "#fff",
          }}
        >
          {/* TABLE TOP BAR */}

          <Box
            sx={{
              px: {
                xs: 1,
                md: 1.5,
              },

              py: 0.85,

              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",

              gap: 1,

              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <Box
              sx={{
                minWidth: 0,
              }}
            >
          {/*     <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                Student Attendance
              </Typography>
 */}
              <Typography
                sx={{
                  fontSize: 10.5,
                  color: "#64748b",
                  mt: 0.1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {selectedClass?.className || "Class"}
                {selectedClass?.section
                  ? ` - ${selectedClass.section}`
                  : ""}
                {" • "}
                {formatDate(date)}
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
            >
              <Chip
                size="small"
                label={`${filteredStudents.length} shown`}
                sx={{
                  height: 25,
                  fontSize: 9.5,
                  fontWeight: 700,
                  bgcolor: "#f1f5f9",
                }}
              />

              <Button
                size="small"
                variant="outlined"
                startIcon={
                  <Refresh sx={{ fontSize: 15 }} />
                }
                onClick={() => refetch()}
                disabled={
                  attendanceFetching ||
                  studentsFetching
                }
                sx={{
                  height: 29,
                  minWidth: 0,
                  px: 1,
                  borderRadius: 1,
                  textTransform: "none",
                  fontSize: 10,
                }}
              >
                Refresh
              </Button>
            </Stack>
          </Box>

          {/* EMPTY */}

          {!filteredStudents.length ? (
            <Box
              sx={{
                py: 5,
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                No students found
              </Typography>

              <Typography
                sx={{
                  fontSize: 11,
                  color: "#64748b",
                  mt: 0.5,
                }}
              >
                Try changing the search or status filter.
              </Typography>
            </Box>
          ) : (
            <TableContainer
              sx={{
                maxHeight: {
                  xs: "calc(100vh - 390px)",
                  md: "calc(100vh - 350px)",
                },

                overflowX: "auto",
              }}
            >
              <Table
                stickyHeader
                size="small"
                sx={{
                  minWidth: 900,

                  "& .MuiTableCell-root": {
                    borderBottom:
                      "1px solid #eef2f7",
                  },
                }}
              >
                {/* ==================================================
                    TABLE HEADER
                ================================================== */}

                <TableHead>
                  <TableRow
                    sx={{
                      "& th": {
                        backgroundColor:
                          "#4f1da5 !important",

                        color:
                          "#ffffff !important",

                        height: 38,

                        px: 1.25,
                        py: 0.5,

                        verticalAlign: "middle",

                        borderBottom: "none",

                        fontSize: 10,

                        fontWeight: 800,

                        textTransform:
                          "uppercase",

                        letterSpacing:
                          "0.035em",

                        whiteSpace:
                          "nowrap",
                      },

                      "& th:first-of-type": {
                        borderTopLeftRadius: 8,
                      },

                      "& th:last-of-type": {
                        borderTopRightRadius: 8,
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        width: 55,
                      }}
                    >
                      S.No
                    </TableCell>

                    <TableCell
                      sx={{
                        width: 90,
                      }}
                    >
                      Roll No
                    </TableCell>

                    <TableCell
                      sx={{
                        width: 190,
                      }}
                    >
                      Student
                    </TableCell>

                    <TableCell
                      sx={{
                        width: 220,
                      }}
                    >
                      Email
                    </TableCell>

                    <TableCell
                      sx={{
                        width: 310,
                      }}
                    >
                      Attendance
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{
                        width: 90,

                        position: "sticky",
                        right: 0,

                        zIndex: 4,

                        backgroundColor:
                          "#4f1da5 !important",
                      }}
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>

                {/* ==================================================
                    TABLE BODY
                ================================================== */}

                <TableBody>
                  {filteredStudents.map(
                    (student, index) => {
                      const studentId =
                        student?.user?._id;

                      const currentStatus =
                        statusMap[studentId] ||
                        STATUS.PRESENT;

                      return (
                        <TableRow
                          key={studentId}
                          hover
                          sx={{
                            height: 47,

                            "&:hover": {
                              bgcolor:
                                "#f8fafc",
                            },
                          }}
                        >
                          {/* S.NO */}

                          <TableCell
                            sx={{
                              px: 1.25,
                              py: 0.5,
                              fontSize: 11,
                              color: "#64748b",
                            }}
                          >
                            {index + 1}
                          </TableCell>

                          {/* ROLL */}

                          <TableCell
                            sx={{
                              px: 1.25,
                              py: 0.5,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#334155",
                              }}
                            >
                              {student?.rollNumber ||
                                "-"}
                            </Typography>
                          </TableCell>

                          {/* STUDENT */}

                          <TableCell
                            sx={{
                              px: 1.25,
                              py: 0.5,
                            }}
                          >
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={0.75}
                              sx={{
                                minWidth: 0,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius:
                                    "50%",
                                  bgcolor:
                                    "#ede9fe",
                                  color:
                                    "#4f1da5",
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  fontSize: 10,
                                  fontWeight: 800,
                                  flexShrink: 0,
                                }}
                              >
                                {(
                                  student?.user
                                    ?.name ||
                                  "S"
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </Box>

                              <Typography
                                sx={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color:
                                    "#0f172a",

                                  overflow:
                                    "hidden",

                                  textOverflow:
                                    "ellipsis",

                                  whiteSpace:
                                    "nowrap",
                                }}
                              >
                                {student?.user
                                  ?.name || "-"}
                              </Typography>
                            </Stack>
                          </TableCell>

                          {/* EMAIL */}

                          <TableCell
                            sx={{
                              px: 1.25,
                              py: 0.5,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 10.5,
                                color: "#64748b",

                                overflow:
                                  "hidden",

                                textOverflow:
                                  "ellipsis",

                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {student?.user
                                ?.email || "-"}
                            </Typography>
                          </TableCell>

                          {/* ATTENDANCE */}

                          <TableCell
                            sx={{
                              px: 1,
                              py: 0.5,
                            }}
                          >
                            <RadioGroup
                              row
                              value={
                                currentStatus
                              }
                              onChange={(e) =>
                                handleStatusChange(
                                  studentId,
                                  e.target.value
                                )
                              }
                              sx={{
                                flexWrap:
                                  "nowrap",
                                gap: 0.25,
                              }}
                            >
                              <AttendanceRadio
                                value={
                                  STATUS.PRESENT
                                }
                                label="Present"
                                color="success"
                                selected={
                                  currentStatus ===
                                  STATUS.PRESENT
                                }
                              />

                              <AttendanceRadio
                                value={
                                  STATUS.ABSENT
                                }
                                label="Absent"
                                color="error"
                                selected={
                                  currentStatus ===
                                  STATUS.ABSENT
                                }
                              />

                              <AttendanceRadio
                                value={
                                  STATUS.LEAVE
                                }
                                label="Leave"
                                color="warning"
                                selected={
                                  currentStatus ===
                                  STATUS.LEAVE
                                }
                              />
                            </RadioGroup>
                          </TableCell>

                          {/* ACTION */}

                          <TableCell
                            align="center"
                            sx={{
                              px: 0.75,
                              py: 0.5,

                              position: "sticky",
                              right: 0,

                              backgroundColor:
                                "#ffffff",

                              zIndex: 2,

                              boxShadow:
                                "-3px 0 6px rgba(15,23,42,0.04)",
                            }}
                          >
                            <StudentAttendanceDownload
                              student={student}
                              classId={classId}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    }
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* ==================================================
              SAVE BAR
          ================================================== */}

          {classStudents.length > 0 && (
            <Box
              sx={{
                px: {
                  xs: 1,
                  md: 1.5,
                },

                py: 0.75,

                borderTop:
                  "1px solid #e2e8f0",

                display: "flex",

                alignItems: "center",

                justifyContent:
                  "space-between",

                gap: 1,

                backgroundColor:
                  "#ffffff",

                position: "sticky",
                bottom: 0,

                zIndex: 5,
              }}
            >
              {/* STATUS INFO */}

              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
              >
                <Chip
                  size="small"
                  label={`P ${counts.present}`}
                  sx={{
                    height: 24,
                    fontSize: 9.5,
                    fontWeight: 800,
                    color: "#15803d",
                    bgcolor: "#f0fdf4",
                  }}
                />

                <Chip
                  size="small"
                  label={`A ${counts.absent}`}
                  sx={{
                    height: 24,
                    fontSize: 9.5,
                    fontWeight: 800,
                    color: "#dc2626",
                    bgcolor: "#fef2f2",
                  }}
                />

                <Chip
                  size="small"
                  label={`L ${counts.leave}`}
                  sx={{
                    height: 24,
                    fontSize: 9.5,
                    fontWeight: 800,
                    color: "#d97706",
                    bgcolor: "#fffbeb",
                  }}
                />
              </Stack>

              {/* SAVE */}

              <Button
                variant="contained"
                size="small"
                onClick={handleSubmit}
                disabled={marking || updating}
                sx={{
                  height: 32,
                  minWidth: {
                    xs: 135,
                    sm: 160,
                  },

                  px: 1.5,

                  borderRadius: 1,

                  textTransform: "none",

                  fontSize: 11,

                  fontWeight: 800,

                  boxShadow: "none",
                }}
              >
                {marking || updating ? (
                  <Stack
                    direction="row"
                    spacing={0.75}
                    alignItems="center"
                  >
                    <CircularProgress
                      size={15}
                      color="inherit"
                    />

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
// STATUS FILTER CHIP
// ======================================================

function StatusFilterChip({
  label,
  active,
  type,
  onClick,
}) {
  const colors = {
    success: {
      bg: "#f0fdf4",
      color: "#15803d",
    },

    error: {
      bg: "#fef2f2",
      color: "#dc2626",
    },

    warning: {
      bg: "#fffbeb",
      color: "#d97706",
    },

    default: {
      bg: "#f1f5f9",
      color: "#475569",
    },
  };

  const selected =
    type && active
      ? colors[type]
      : active
        ? {
            bg: "#ede9fe",
            color: "#4f1da5",
          }
        : colors.default;

  return (
    <Chip
      clickable
      size="small"
      label={label}
      onClick={onClick}
      sx={{
        height: 32,

        borderRadius: 1,

        fontSize: 9.5,

        fontWeight: 800,

        bgcolor: selected.bg,

        color: selected.color,

        border: active
          ? `1px solid ${selected.color}30`
          : "1px solid transparent",

        whiteSpace: "nowrap",

        "&:hover": {
          bgcolor: selected.bg,
        },
      }}
    />
  );
}

// ======================================================
// ATTENDANCE RADIO
// ======================================================

function AttendanceRadio({
  value,
  label,
  color,
  selected,
}) {
  const styles = {
    success: {
      bg: "#f0fdf4",
      border: "#bbf7d0",
      text: "#15803d",
    },

    error: {
      bg: "#fef2f2",
      border: "#fecaca",
      text: "#dc2626",
    },

    warning: {
      bg: "#fffbeb",
      border: "#fde68a",
      text: "#d97706",
    },
  };

  const style = styles[color];

  return (
    <FormControlLabel
      value={value}
      control={
        <Radio
          size="small"
          color={color}
          sx={{
            p: 0.35,
            display: "none",
          }}
        />
      }
      label={
        <Box
          sx={{
            height: 29,

            px: 1,

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            borderRadius: 1,

            border: `1px solid ${
              selected
                ? style.border
                : "#e2e8f0"
            }`,

            bgcolor: selected
              ? style.bg
              : "#ffffff",

            color: selected
              ? style.text
              : "#64748b",

            fontSize: 10,

            fontWeight: selected
              ? 800
              : 600,

            cursor: "pointer",

            transition:
              "all .15s ease",

            whiteSpace: "nowrap",

            "&:hover": {
              bgcolor: style.bg,
              borderColor:
                style.border,
            },
          }}
        >
          {label}
        </Box>
      }
      sx={{
        m: 0,

        "& .MuiFormControlLabel-label":
          {
            lineHeight: 1,
          },
      }}
    />
  );
}

// ======================================================
// SUMMARY CARD
// ======================================================

function SummaryCard({
  title,
  value,
  icon,
  type,
}) {
  const styles = {
    success: {
      bg: "#f0fdf4",
      color: "#16a34a",
    },

    error: {
      bg: "#fef2f2",
      color: "#dc2626",
    },

    warning: {
      bg: "#fffbeb",
      color: "#d97706",
    },

    default: {
      bg: "#f8fafc",
      color: "#4f1da5",
    },
  };

  const style =
    styles[type || "default"];

  return (
    <Card
      elevation={0}
      sx={{
        border:
          "1px solid #e2e8f0",

        borderRadius: 1.5,

        height: "100%",

        bgcolor: "#ffffff",
      }}
    >
      <CardContent
        sx={{
          p: {
            xs: 1,
            md: 1.15,
          },

          "&:last-child": {
            pb: {
              xs: 1,
              md: 1.15,
            },
          },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 10,
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              {title}
            </Typography>

            <Typography
              sx={{
                fontSize: 18,
                lineHeight: 1.1,
                mt: 0.35,
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              {value}
            </Typography>
          </Box>

          <Box
            sx={{
              width: 32,
              height: 32,

              borderRadius: 1,

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              color: style.color,

              bgcolor: style.bg,

              flexShrink: 0,

              "& svg": {
                fontSize: 17,
              },
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}