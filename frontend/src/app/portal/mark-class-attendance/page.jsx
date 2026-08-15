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
  TextField,
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
} from "@mui/icons-material";

import { useMyAssignments } from "@/hooks/useTeacherAssignments";

import {
  useStudentsByClass,
} from "@/hooks/useStudent";

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

const formatDate = (date) => {
  if (!date) return "";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

function TeacherAttendanceContent() {
  // ======================================================
  // STATE
  // ======================================================

  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [statusMap, setStatusMap] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(STATUS.ALL);

  // ======================================================
  // TEACHER ASSIGNMENTS
  // ======================================================

  const {
    data: assignments = [],
    isLoading: assignmentsLoading,
    isFetching: assignmentsFetching,
    refetch: refetchAssignments,
  } = useMyAssignments();

  // ======================================================
  // ONLY ASSIGNED CLASSES
  // ======================================================

  const assignedClasses = useMemo(() => {
    const map = new Map();

    assignments.forEach((assignment) => {
      const cls = assignment?.class;

      if (!cls?._id) return;

      if (!map.has(cls._id)) {
        map.set(cls._id, {
          ...cls,
        });
      }
    });

    return Array.from(map.values());
  }, [assignments]);

  // ======================================================
  // STUDENTS
  // ======================================================

  const {
    data: classStudents = [],
    isLoading: studentsLoading,
    isFetching: studentsFetching,
  } = useStudentsByClass(classId);

  // ======================================================
  // EXISTING ATTENDANCE
  // ======================================================

  const {
    data: existing,
    isLoading: attendanceLoading,
    isFetching: attendanceFetching,
    refetch,
  } = useClassAttendance(classId, date);

  // ======================================================
  // MUTATIONS
  // ======================================================

  const {
    mutate: markAttendance,
    isPending: marking,
  } = useMarkAttendance();

  const {
    mutate: updateAttendance,
    isPending: updating,
  } = useUpdateAttendance();

  // ======================================================
  // SELECTED CLASS
  // ======================================================

  const selectedClass = useMemo(() => {
    return assignedClasses.find(
      (item) => String(item._id) === String(classId)
    );
  }, [assignedClasses, classId]);

  // ======================================================
  // AUTO SELECT FIRST ASSIGNED CLASS
  // ======================================================

  useEffect(() => {
    if (!classId && assignedClasses.length > 0) {
      setClassId(assignedClasses[0]._id);
    }
  }, [assignedClasses, classId]);

  // ======================================================
  // RESET CLASS DATA
  // ======================================================

  useEffect(() => {
    setStatusMap({});
    setSearch("");
    setStatusFilter(STATUS.ALL);
  }, [classId, date]);

  // ======================================================
  // INITIALIZE ATTENDANCE
  // ======================================================

  useEffect(() => {
    if (!classStudents.length) {
      setStatusMap({});
      return;
    }

    const map = {};

    // Default = PRESENT
    classStudents.forEach((student) => {
      const studentId = student?.user?._id;

      if (studentId) {
        map[studentId] = STATUS.PRESENT;
      }
    });

    // Existing attendance override
    if (existing?.records?.length) {
      existing.records.forEach((record) => {
        const studentId =
          record?.student?._id ||
          record?.student;

        if (studentId) {
          map[studentId] = record.status;
        }
      });
    }

    setStatusMap(map);
  }, [classStudents, existing]);

  // ======================================================
  // STATUS CHANGE
  // ======================================================

  const handleStatusChange = (studentId, status) => {
    setStatusMap((previous) => ({
      ...previous,
      [studentId]: status,
    }));
  };

  // ======================================================
  // COUNTS
  // ======================================================

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

  // ======================================================
  // FILTERED STUDENTS
  // ======================================================

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

  // ======================================================
  // CLEAR FILTERS
  // ======================================================

  const clearFilters = () => {
    setSearch("");
    setStatusFilter(STATUS.ALL);
  };

  // ======================================================
  // SAVE ATTENDANCE
  // ======================================================

  const handleSubmit = () => {
    if (!classId) {
      return;
    }

    if (!classStudents.length) {
      return;
    }

    const records = classStudents
      .map((student) => {
        const studentId = student?.user?._id;

        if (!studentId) return null;

        return {
          student: studentId,
          status:
            statusMap[studentId] || STATUS.PRESENT,
        };
      })
      .filter(Boolean);

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

  // ======================================================
  // LOADING
  // ======================================================

  const pageLoading =
    assignmentsLoading ||
    studentsLoading ||
    attendanceLoading;

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <Box
      sx={{
        p: {
          xs: 1.5,
          sm: 2,
          md: 3,
        },
        maxWidth: 1500,
        mx: "auto",
      }}
    >
      {/* ==================================================
          HEADER
      ================================================== */}

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
          >
            My Attendance
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Mark and manage attendance for your assigned classes
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => {
            refetch();
            refetchAssignments();
          }}
          disabled={
            assignmentsFetching ||
            attendanceFetching ||
            studentsFetching
          }
          sx={{
            textTransform: "none",
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* ==================================================
          NO ASSIGNMENTS
      ================================================== */}

      {!assignmentsLoading &&
        assignedClasses.length === 0 && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            You currently have no active class assignments.
          </Alert>
        )}

      {/* ==================================================
          FILTER PANEL
      ================================================== */}

      {assignedClasses.length > 0 && (
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
          <Typography
            fontWeight={600}
            sx={{ mb: 1.5 }}
          >
            Attendance Filters
          </Typography>

          <Grid container spacing={2}>
            {/* CLASS */}

            <Grid item xs={12} sm={6} md={3}>
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
                  disabled={assignmentsLoading}
                >
                  <MenuItem value="" disabled>
                    Select Class
                  </MenuItem>

                  {assignedClasses.map((item) => (
                    <MenuItem
                      key={item._id}
                      value={item._id}
                    >
                      {item.className}
                      {item.section
                        ? ` - ${item.section}`
                        : ""}
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
                onChange={(e) =>
                  setDate(e.target.value)
                }
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
                onChange={(e) =>
                  setSearch(e.target.value)
                }
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

            {/* CLEAR */}

            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterAltOff />}
                onClick={clearFilters}
                disabled={
                  !search &&
                  statusFilter === STATUS.ALL
                }
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

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
          >
            <Chip
              label={`All (${counts.total})`}
              clickable
              color={
                statusFilter === STATUS.ALL
                  ? "primary"
                  : "default"
              }
              onClick={() =>
                setStatusFilter(STATUS.ALL)
              }
            />

            <Chip
              label={`Present (${counts.present})`}
              clickable
              color={
                statusFilter === STATUS.PRESENT
                  ? "success"
                  : "default"
              }
              onClick={() =>
                setStatusFilter(STATUS.PRESENT)
              }
            />

            <Chip
              label={`Absent (${counts.absent})`}
              clickable
              color={
                statusFilter === STATUS.ABSENT
                  ? "error"
                  : "default"
              }
              onClick={() =>
                setStatusFilter(STATUS.ABSENT)
              }
            />

            <Chip
              label={`Leave (${counts.leave})`}
              clickable
              color={
                statusFilter === STATUS.LEAVE
                  ? "warning"
                  : "default"
              }
              onClick={() =>
                setStatusFilter(STATUS.LEAVE)
              }
            />
          </Stack>
        </Paper>
      )}

      {/* ==================================================
          SUMMARY
      ================================================== */}

      {classId && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={4}>
            <SummaryCard
              title="Present"
              value={counts.present}
              icon={<CheckCircle />}
              color="success"
            />
          </Grid>

          <Grid item xs={6} md={4}>
            <SummaryCard
              title="Absent"
              value={counts.absent}
              icon={<Cancel />}
              color="error"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <SummaryCard
              title="Leave"
              value={counts.leave}
              icon={<EventBusy />}
              color="warning"
            />
          </Grid>
        </Grid>
      )}

      {/* ==================================================
          LOADING
      ================================================== */}

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
            sx={{ mt: 2 }}
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
              <Typography fontWeight={700}>
                Student Attendance
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {selectedClass?.className || "Class"}
                {selectedClass?.section
                  ? ` - ${selectedClass.section}`
                  : ""}
                {" • "}
                {formatDate(date)}
              </Typography>
            </Box>

            <Chip
              size="small"
              label={`${filteredStudents.length} Students`}
            />
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
              <Typography fontWeight={600}>
                No students found
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Try changing the search or status filter.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                overflowX: "auto",
              }}
            >
              <Box
                sx={{
                  minWidth: 900,
                }}
              >
                {filteredStudents.map(
                  (student, index) => {
                    const studentId =
                      student?.user?._id;

                    const currentStatus =
                      statusMap[studentId] ||
                      STATUS.PRESENT;

                    return (
                      <Box
                        key={studentId}
                        sx={{
                          px: 2,
                          py: 1.5,
                          borderBottom:
                            "1px solid",
                          borderColor:
                            "divider",
                          display: "grid",
                          gridTemplateColumns:
                            "60px 100px minmax(180px, 1fr) minmax(220px, 1fr) 350px",
                          alignItems: "center",
                          gap: 1,
                          "&:hover": {
                            backgroundColor:
                              "action.hover",
                          },
                        }}
                      >
                        <Typography
                          variant="body2"
                        >
                          {index + 1}
                        </Typography>

                        <Typography
                          variant="body2"
                          fontWeight={600}
                        >
                          {student?.rollNumber ||
                            "-"}
                        </Typography>

                        <Box>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                          >
                            {student?.user?.name ||
                              "-"}
                          </Typography>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {student?.user?.email ||
                              "-"}
                          </Typography>
                        </Box>

                        <Box>
                          <Chip
                            size="small"
                            label={
                              currentStatus ===
                              STATUS.PRESENT
                                ? "Present"
                                : currentStatus ===
                                  STATUS.ABSENT
                                ? "Absent"
                                : "Leave"
                            }
                            color={
                              currentStatus ===
                              STATUS.PRESENT
                                ? "success"
                                : currentStatus ===
                                  STATUS.ABSENT
                                ? "error"
                                : "warning"
                            }
                          />
                        </Box>

                        <RadioGroup
                          row
                          value={currentStatus}
                          onChange={(e) =>
                            handleStatusChange(
                              studentId,
                              e.target.value
                            )
                          }
                        >
                          <FormControlLabel
                            value={
                              STATUS.PRESENT
                            }
                            control={
                              <Radio
                                size="small"
                                color="success"
                              />
                            }
                            label="Present"
                          />

                          <FormControlLabel
                            value={
                              STATUS.ABSENT
                            }
                            control={
                              <Radio
                                size="small"
                                color="error"
                              />
                            }
                            label="Absent"
                          />

                          <FormControlLabel
                            value={
                              STATUS.LEAVE
                            }
                            control={
                              <Radio
                                size="small"
                                color="warning"
                              />
                            }
                            label="Leave"
                          />
                        </RadioGroup>
                      </Box>
                    );
                  }
                )}
              </Box>
            </Box>
          )}

          {/* ==================================================
              SAVE
          ================================================== */}

          {classStudents.length > 0 && (
            <Box
              sx={{
                p: 2,
                borderTop: "1px solid",
                borderColor: "divider",
                display: "flex",
                justifyContent: "flex-end",
                backgroundColor:
                  "background.paper",
              }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={
                  marking || updating ? (
                    <CircularProgress
                      size={18}
                      color="inherit"
                    />
                  ) : (
                    <Save />
                  )
                }
                onClick={handleSubmit}
                disabled={marking || updating}
                sx={{
                  minWidth: 200,
                  textTransform: "none",
                }}
              >
                {marking || updating
                  ? "Saving..."
                  : existing
                  ? "Update Attendance"
                  : "Mark Attendance"}
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

function SummaryCard({
  title,
  value,
  icon,
  color,
}) {
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
        >
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              {title}
            </Typography>

            <Typography
              variant="h5"
              fontWeight={700}
              sx={{ mt: 0.5 }}
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
              color: `${color}.main`,
              backgroundColor:
                "action.hover",
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ======================================================
// PAGE
// ======================================================

export default function TeacherAttendancePage() {
  return (
    <PortalGuard allowedRoles={["TEACHER"]}>
      <TeacherAttendanceContent />
    </PortalGuard>
  );
}