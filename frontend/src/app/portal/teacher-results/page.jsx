"use client";

import { useEffect, useMemo, useState } from "react";
import PortalGuard from "@/components/PortalGuard";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import {
  Assessment,
  CheckCircle,
  DoneAll,
  ErrorOutline,
  Save,
  School,
  WarningAmber,
} from "@mui/icons-material";

import { useMyAssignments } from "@/hooks/useTeacherAssignments";
import { useExamsByClass } from "@/hooks/useExam";
import { useStudentsByClass } from "@/hooks/useStudent";
import { useEnterResult, useClassResults } from "@/hooks/useResult";
import ExcelResultImportExport from "@/components/ExcelResultImportExport";

// =====================================================
// COLORS
// =====================================================

const COLORS = {
  primary: "#4C1D95",
  primaryDark: "#3B0764",
  primaryDeep: "#2E1065",
  accent: "#6D28D9",
  accentLight: "#8B5CF6",

  surfaceTint: "#F3ECFE",
  border: "#DCC9FA",
  bgPage: "#F6F3FC",

  textMuted: "#6B7280",
  textDark: "#1E1B2E",

  error: "#B91C1C",
  errorSoft: "#FEF2F2",

  warning: "#B45309",
  warningSoft: "#FFFBEB",

  success: "#166534",
  successSoft: "#DCFCE7",
};

// =====================================================
// VALIDATION
// =====================================================

function validateMark(value, maxMarks) {
  if (value === "" || value === undefined || value === null) {
    return "Required";
  }

  const stringValue = String(value).trim();

  if (!/^\d+$/.test(stringValue)) {
    return "Enter a valid number";
  }

  const num = Number(stringValue);

  if (!Number.isFinite(num)) {
    return "Invalid";
  }

  if (num < 0) {
    return "Can't be negative";
  }

  if (num > Number(maxMarks)) {
    return `Maximum ${maxMarks} marks allowed`;
  }

  return "";
}

// Don't clamp the value.
// Whatever user enters stays visible.
// Validation decides whether Save is allowed.
function sanitizeMarkInput(rawValue) {
  if (rawValue === "") return "";

  // Only allow digits.
  return String(rawValue).replace(/[^\d]/g, "");
}

// =====================================================
// MAIN CONTENT
// =====================================================

function ResultsEntryContent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const {
    data: assignments = [],
    isLoading: assignmentsLoading,
  } = useMyAssignments();

  const myClasses = useMemo(() => {
    const map = new Map();

    assignments.forEach((assignment) => {
      if (assignment.class?._id) {
        map.set(assignment.class._id, assignment.class);
      }
    });

    return [...map.values()];
  }, [assignments]);

  const [classId, setClassId] = useState("");
  const [examId, setExamId] = useState("");

  const {
    data: exams = [],
    isLoading: examsLoading,
  } = useExamsByClass(classId);

  const {
    data: studentsData,
    isLoading: studentsLoading,
  } = useStudentsByClass(classId);

  const students = studentsData?.students ?? [];

  const {
    data: results = [],
  } = useClassResults(examId);

  const {
    mutate: enterResult,
    isPending,
  } = useEnterResult();

  const selectedExam = exams.find((exam) => exam._id === examId);

  // =====================================================
  // LOCAL FORM STATE
  // =====================================================

  const [marksForm, setMarksForm] = useState({});
  const [savedIds, setSavedIds] = useState({});
  const [savingIds, setSavingIds] = useState({});
  const [savingAll, setSavingAll] = useState(false);
  const [saveAllError, setSaveAllError] = useState("");

  // =====================================================
  // RESET WHEN EXAM CHANGES
  // =====================================================

  useEffect(() => {
    setMarksForm({});
    setSavedIds({});
    setSavingIds({});
    setSaveAllError("");
  }, [examId]);

  // =====================================================
  // LOAD SERVER RESULTS
  // =====================================================

  useEffect(() => {
    if (!selectedExam || !results.length) return;

    setMarksForm((prev) => {
      const next = { ...prev };

      results.forEach((result) => {
        const studentId = result.student?._id;

        if (!studentId) return;

        const existing = next[studentId] || {};
        const merged = { ...existing };

        (result.marks || []).forEach((mark) => {
          if (merged[mark.subject] === undefined) {
            merged[mark.subject] = String(mark.marksObtained);
          }
        });

        next[studentId] = merged;
      });

      return next;
    });
  }, [results, selectedExam]);

  // =====================================================
  // HELPERS
  // =====================================================

  const getStudentId = (student) =>
    student.user?._id || student._id;

  const getStudentName = (student) =>
    student.user?.name ||
    student.name ||
    "Unknown Student";

  const getMarkValue = (studentId, subject) =>
    marksForm[studentId]?.[subject] ?? "";

  // =====================================================
  // MARK CHANGE
  // =====================================================

  const handleMarkChange = (
    studentId,
    subject,
    rawValue
  ) => {
    const cleanValue = sanitizeMarkInput(rawValue);

    setMarksForm((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subject]: cleanValue,
      },
    }));

    setSavedIds((prev) => ({
      ...prev,
      [studentId]: false,
    }));

    setSaveAllError("");
  };

  // =====================================================
  // ROW VALIDATION
  // =====================================================

  const getRowErrors = (studentId) => {
    if (!selectedExam) return {};

    const errors = {};

    selectedExam.subjects.forEach((subject) => {
      const value = getMarkValue(
        studentId,
        subject.subject
      );

      const error = validateMark(
        value,
        subject.maxMarks
      );

      if (error) {
        errors[subject.subject] = error;
      }
    });

    return errors;
  };

  const hasRowErrors = (studentId) => {
    return Object.keys(getRowErrors(studentId)).length > 0;
  };

  // =====================================================
  // PAYLOAD
  // =====================================================

  const buildMarksPayload = (studentId) => {
    if (!selectedExam) return [];

    return selectedExam.subjects.map((subject) => ({
      subject: subject.subject,
      marksObtained: Number(
        getMarkValue(
          studentId,
          subject.subject
        )
      ),
    }));
  };

  // =====================================================
  // SAVE SINGLE STUDENT
  // =====================================================

  const handleSave = (studentId) => {
    if (!selectedExam) return;

    const rowErrors = getRowErrors(studentId);

    if (Object.keys(rowErrors).length > 0) {
      return;
    }

    setSavingIds((prev) => ({
      ...prev,
      [studentId]: true,
    }));

    enterResult(
      {
        examId,
        studentId,
        marks: buildMarksPayload(studentId),
      },
      {
        onSuccess: () => {
          setSavedIds((prev) => ({
            ...prev,
            [studentId]: true,
          }));
        },

        onSettled: () => {
          setSavingIds((prev) => ({
            ...prev,
            [studentId]: false,
          }));
        },
      }
    );
  };

  // =====================================================
  // SAVE ALL
  // =====================================================

  const handleSaveAll = async () => {
    if (!selectedExam || !students.length) return;

    setSaveAllError("");

    let invalidCount = 0;

    students.forEach((student) => {
      const studentId = getStudentId(student);

      if (!studentId) return;

      if (hasRowErrors(studentId)) {
        invalidCount += 1;
      }
    });

    if (invalidCount > 0) {
      setSaveAllError(
        `Fix ${invalidCount} student${
          invalidCount === 1 ? "" : "s"
        } with invalid or missing marks before saving all.`
      );

      return;
    }

    setSavingAll(true);

    for (const student of students) {
      const studentId = getStudentId(student);

      if (!studentId) continue;

      await new Promise((resolve) => {
        enterResult(
          {
            examId,
            studentId,
            marks: buildMarksPayload(studentId),
          },
          {
            onSuccess: () => {
              setSavedIds((prev) => ({
                ...prev,
                [studentId]: true,
              }));
            },

            onSettled: resolve,
          }
        );
      });
    }

    setSavingAll(false);
  };

  // =====================================================
  // COUNTS
  // =====================================================

  const savedCount = useMemo(
    () =>
      Object.values(savedIds).filter(Boolean).length,
    [savedIds]
  );

  const invalidStudentCount = useMemo(() => {
    if (!selectedExam || !students.length) return 0;

    return students.reduce((count, student) => {
      const studentId = getStudentId(student);

      if (!studentId) return count;

      return hasRowErrors(studentId)
        ? count + 1
        : count;
    }, 0);
  }, [students, selectedExam, marksForm]);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <Box>
      {/* HEADER */}

      <Box
        sx={{
          mb: 1.25,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Avatar
          sx={{
            width: { xs: 32, sm: 36 },
            height: { xs: 32, sm: 36 },
            background: `linear-gradient(
              135deg,
              ${COLORS.accent},
              ${COLORS.primaryDark}
            )`,
            boxShadow:
              "0 3px 10px rgba(76,29,149,0.25)",
          }}
        >
          <Assessment sx={{ fontSize: 18 }} />
        </Avatar>

        <Box>
          <Typography
            sx={{
              fontSize: { xs: 16, sm: 18 },
              fontWeight: 800,
              color: COLORS.textDark,
              lineHeight: 1.1,
            }}
          >
            Enter Results
          </Typography>

          <Typography
            sx={{
              fontSize: 11,
              color: COLORS.textMuted,
            }}
          >
            Enter marks for your assigned classes
          </Typography>
        </Box>
      </Box>

      {/* FILTERS */}

      <Paper elevation={0} sx={cardSx}>
        <Box
          sx={{
            px: 1.25,
            py: 0.7,
            background: `linear-gradient(
              90deg,
              ${COLORS.primaryDeep},
              ${COLORS.primaryDark}
            )`,
            color: "#fff",
          }}
        >
          <Typography
            fontSize={11.5}
            fontWeight={800}
          >
            Select Class & Exam
          </Typography>
        </Box>

        <Box sx={{ p: 1.25 }}>
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={0.75}
            alignItems={{
              xs: "stretch",
              sm: "center",
            }}
          >
            <Select
              displayEmpty
              size="small"
              fullWidth={isMobile}
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value);
                setExamId("");
              }}
              disabled={assignmentsLoading}
              sx={selectSx}
            >
              <MenuItem value="" disabled>
                {assignmentsLoading
                  ? "Loading classes..."
                  : "Select Class"}
              </MenuItem>

              {myClasses.map((item) => (
                <MenuItem
                  key={item._id}
                  value={item._id}
                >
                  {item.className} - {item.section}
                </MenuItem>
              ))}
            </Select>

            <Select
              displayEmpty
              size="small"
              fullWidth={isMobile}
              value={examId}
              onChange={(event) =>
                setExamId(event.target.value)
              }
              disabled={!classId || examsLoading}
              sx={selectSx}
            >
              <MenuItem value="" disabled>
                {!classId
                  ? "Select a class first"
                  : examsLoading
                  ? "Loading exams..."
                  : "Select Exam"}
              </MenuItem>

              {exams.map((exam) => (
                <MenuItem
                  key={exam._id}
                  value={exam._id}
                >
                  {exam.examName}
                </MenuItem>
              ))}
            </Select>

            {classId && (
              <Chip
                size="small"
                icon={
                  <School sx={{ fontSize: 14 }} />
                }
                label={`${students.length} student${
                  students.length === 1 ? "" : "s"
                }`}
                sx={{
                  alignSelf: {
                    xs: "flex-start",
                    sm: "center",
                  },
                  backgroundColor:
                    COLORS.surfaceTint,
                  color: COLORS.primaryDark,
                  fontWeight: 700,
                  height: 24,
                  fontSize: 11,
                }}
              />
            )}
          </Stack>
        </Box>
      </Paper>

      {/* EXCEL */}

      {selectedExam && (
        <ExcelResultImportExport
          examId={examId}
          examName={selectedExam.examName}
          subjects={selectedExam.subjects}
        />
      )}

      {/* EMPTY STATES */}

      {!assignmentsLoading &&
        myClasses.length === 0 && (
          <EmptyState
            title="No classes assigned"
            subtitle="You are not assigned to any class yet."
          />
        )}

      {myClasses.length > 0 && !classId && (
        <EmptyState
          title="Choose a class to begin"
          subtitle="Select a class and exam above to start entering results."
        />
      )}

      {classId && studentsLoading && (
        <Stack spacing={0.75}>
          <Skeleton
            variant="rounded"
            height={34}
          />
          <Skeleton
            variant="rounded"
            height={150}
          />
        </Stack>
      )}

      {classId &&
        !studentsLoading &&
        !students.length && (
          <EmptyState
            title="No students found"
            subtitle="This class doesn't have any students yet."
          />
        )}

      {classId &&
        students.length > 0 &&
        !examId && (
          <EmptyState
            title="Select an exam"
            subtitle="Choose an exam above to enter or view marks."
          />
        )}

      {/* RESULT ENTRY */}

      {selectedExam && students.length > 0 && (
        <Paper elevation={0} sx={cardSx}>
          {/* TABLE HEADER */}

          <Box
            sx={{
              px: 1.25,
              py: 0.8,
              display: "flex",
              alignItems: {
                xs: "flex-start",
                sm: "center",
              },
              justifyContent: "space-between",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Box>
              <Typography
                fontSize={13}
                fontWeight={800}
                color={COLORS.textDark}
              >
                {selectedExam.examName}
              </Typography>

              <Typography
                sx={{
                  fontSize: 10.5,
                  color: COLORS.textMuted,
                }}
              >
                {selectedExam.subjects.length} subject
                {selectedExam.subjects.length === 1
                  ? ""
                  : "s"}
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={0.6}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              {invalidStudentCount > 0 && (
                <Chip
                  size="small"
                  icon={
                    <WarningAmber
                      sx={{ fontSize: 14 }}
                    />
                  }
                  label={`${invalidStudentCount} invalid`}
                  sx={warningChipSx}
                />
              )}

              {savedCount > 0 && (
                <Chip
                  size="small"
                  icon={
                    <CheckCircle
                      sx={{ fontSize: 14 }}
                    />
                  }
                  label={`${savedCount} saved`}
                  sx={successChipSx}
                />
              )}

              <Button
                size="small"
                variant="contained"
                startIcon={
                  <DoneAll sx={{ fontSize: 15 }} />
                }
                onClick={handleSaveAll}
                disabled={
                  savingAll ||
                  isPending ||
                  invalidStudentCount > 0
                }
                fullWidth={isMobile}
                sx={btnSaveAll}
              >
                {savingAll
                  ? "Saving..."
                  : "Save All"}
              </Button>
            </Stack>
          </Box>

          {saveAllError && (
            <Alert
              severity="error"
              icon={
                <ErrorOutline fontSize="small" />
              }
              sx={{
                mx: 1.25,
                mb: 0.75,
                py: 0,
                fontSize: 11.5,
                borderRadius: 1.25,
              }}
            >
              {saveAllError}
            </Alert>
          )}

          <Divider />

          {/* DESKTOP */}

          {!isMobile && (
            <TableContainer
              sx={{
                overflowX: "auto",
              }}
            >
              <Table
                size="small"
                sx={{
                  minWidth: 640,
                  "& .MuiTableCell-root": {
                    borderColor: "#EEE8F8",
                  },
                }}
              >
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor:
                        COLORS.surfaceTint,
                    }}
                  >
                    <TableCell sx={headCellSx}>
                      Student
                    </TableCell>

                    {selectedExam.subjects.map(
                      (subject) => (
                        <TableCell
                          key={subject.subject}
                          sx={headCellSx}
                        >
                          {subject.subject}

                          <Typography
                            component="span"
                            sx={{
                              display: "block",
                              fontWeight: 500,
                              fontSize: 9.5,
                              color:
                                COLORS.textMuted,
                            }}
                          >
                            max {subject.maxMarks}
                          </Typography>
                        </TableCell>
                      )
                    )}

                    <TableCell
                      sx={{
                        ...headCellSx,
                        textAlign: "right",
                      }}
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {students.map((student) => {
                    const studentId =
                      getStudentId(student);

                    const name =
                      getStudentName(student);

                    const isSaved =
                      savedIds[studentId];

                    const isRowSaving =
                      savingIds[studentId];

                    const rowErrors =
                      getRowErrors(studentId);

                    const hasError =
                      Object.keys(rowErrors).length >
                      0;

                    return (
                      <TableRow
                        key={`${studentId}-${examId}`}
                        hover
                        sx={{
                          backgroundColor: hasError
                            ? COLORS.errorSoft
                            : "#fff",

                          "&:last-child td": {
                            borderBottom: 0,
                          },

                          "& td": {
                            py: 0.55,
                          },
                        }}
                      >
                        {/* STUDENT */}

                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={0.75}
                            alignItems="center"
                          >
                            <Avatar
                              sx={{
                                width: 26,
                                height: 26,
                                bgcolor:
                                  COLORS.primary,
                                fontSize: 10.5,
                                fontWeight: 800,
                              }}
                            >
                              {name
                                .charAt(0)
                                .toUpperCase()}
                            </Avatar>

                            <Typography
                              fontSize={12}
                              fontWeight={600}
                              noWrap
                            >
                              {name}
                            </Typography>
                          </Stack>
                        </TableCell>

                        {/* SUBJECTS */}

                        {selectedExam.subjects.map(
                          (subject) => {
                            const value =
                              getMarkValue(
                                studentId,
                                subject.subject
                              );

                            const errorMsg =
                              rowErrors[
                                subject.subject
                              ];

                            const isOverMax =
                              Number(value) >
                              Number(
                                subject.maxMarks
                              );

                            return (
                              <TableCell
                                key={
                                  subject.subject
                                }
                              >
                                <TextField
                                  size="small"
                                  type="text"
                                  inputMode="numeric"
                                  value={value}
                                  onChange={(event) =>
                                    handleMarkChange(
                                      studentId,
                                      subject.subject,
                                      event.target
                                        .value
                                    )
                                  }
                                  error={!!errorMsg}
                                  helperText={
                                    errorMsg || ""
                                  }
                                  placeholder="—"
                                  inputProps={{
                                    inputMode:
                                      "numeric",
                                    style: {
                                      textAlign:
                                        "center",
                                      padding:
                                        "5px 3px",
                                      fontSize: 12,
                                    },
                                  }}
                                  FormHelperTextProps={{
                                    sx: {
                                      fontSize: 8.5,
                                      m: 0,
                                      mt: 0.15,
                                      lineHeight: 1,
                                      whiteSpace:
                                        "nowrap",
                                    },
                                  }}
                                  sx={{
                                    width: 64,

                                    "& .MuiOutlinedInput-root":
                                      {
                                        borderRadius: 1.25,
                                        backgroundColor:
                                          isOverMax
                                            ? COLORS.warningSoft
                                            : "#fff",
                                      },

                                    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                                      {
                                        borderColor:
                                          COLORS.accent,
                                      },
                                  }}
                                />
                              </TableCell>
                            );
                          }
                        )}

                        {/* ACTION */}

                        <TableCell align="right">
                          <Button
                            size="small"
                            variant={
                              isSaved
                                ? "outlined"
                                : "contained"
                            }
                            startIcon={
                              isSaved ? (
                                <CheckCircle
                                  sx={{
                                    fontSize: 14,
                                  }}
                                />
                              ) : (
                                <Save
                                  sx={{
                                    fontSize: 14,
                                  }}
                                />
                              )
                            }
                            onClick={() =>
                              handleSave(
                                studentId
                              )
                            }
                            disabled={
                              isRowSaving ||
                              savingAll ||
                              hasError
                            }
                            sx={
                              isSaved
                                ? btnSaved
                                : btnSave
                            }
                          >
                            {isRowSaving
                              ? "..."
                              : isSaved
                              ? "Saved"
                              : "Save"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* MOBILE */}

          {isMobile && (
            <Stack
              divider={<Divider />}
              spacing={0}
            >
              {students.map((student) => {
                const studentId =
                  getStudentId(student);

                const name =
                  getStudentName(student);

                const isSaved =
                  savedIds[studentId];

                const isRowSaving =
                  savingIds[studentId];

                const rowErrors =
                  getRowErrors(studentId);

                const hasError =
                  Object.keys(rowErrors).length >
                  0;

                return (
                  <Box
                    key={`${studentId}-${examId}`}
                    sx={{
                      p: 1,
                      backgroundColor: hasError
                        ? COLORS.errorSoft
                        : "#fff",
                    }}
                  >
                    {/* STUDENT HEADER */}

                    <Stack
                      direction="row"
                      spacing={0.75}
                      alignItems="center"
                      sx={{ mb: 0.75 }}
                    >
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: COLORS.primary,
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {name
                          .charAt(0)
                          .toUpperCase()}
                      </Avatar>

                      <Typography
                        fontSize={12.5}
                        fontWeight={700}
                        sx={{ flex: 1 }}
                        noWrap
                      >
                        {name}
                      </Typography>

                      {isSaved && (
                        <Chip
                          size="small"
                          icon={
                            <CheckCircle
                              sx={{
                                fontSize: 12,
                              }}
                            />
                          }
                          label="Saved"
                          sx={{
                            ...successChipSx,
                            height: 21,
                            fontSize: 10,
                          }}
                        />
                      )}
                    </Stack>

                    {/* MARK INPUTS */}

                    <Stack
                      direction="row"
                      spacing={0.75}
                      flexWrap="wrap"
                      useFlexGap
                      sx={{ mb: 0.75 }}
                    >
                      {selectedExam.subjects.map(
                        (subject) => {
                          const value =
                            getMarkValue(
                              studentId,
                              subject.subject
                            );

                          const errorMsg =
                            rowErrors[
                              subject.subject
                            ];

                          const isOverMax =
                            Number(value) >
                            Number(
                              subject.maxMarks
                            );

                          return (
                            <TextField
                              key={
                                subject.subject
                              }
                              size="small"
                              type="text"
                              inputMode="numeric"
                              label={`${subject.subject} / ${subject.maxMarks}`}
                              value={value}
                              onChange={(event) =>
                                handleMarkChange(
                                  studentId,
                                  subject.subject,
                                  event.target.value
                                )
                              }
                              error={!!errorMsg}
                              helperText={
                                errorMsg || ""
                              }
                              inputProps={{
                                inputMode:
                                  "numeric",
                              }}
                              FormHelperTextProps={{
                                sx: {
                                  fontSize: 8.5,
                                  m: 0,
                                  mt: 0.15,
                                  lineHeight: 1,
                                },
                              }}
                              sx={{
                                width:
                                  "calc(50% - 4px)",

                                "& .MuiInputBase-input":
                                  {
                                    fontSize: 12,
                                    py: 0.75,
                                  },

                                "& .MuiInputLabel-root":
                                  {
                                    fontSize: 11,
                                  },

                                "& .MuiOutlinedInput-root":
                                  {
                                    borderRadius: 1.25,
                                    backgroundColor:
                                      isOverMax
                                        ? COLORS.warningSoft
                                        : "#fff",
                                  },
                              }}
                            />
                          );
                        }
                      )}
                    </Stack>

                    {/* MOBILE SAVE */}

                    <Button
                      fullWidth
                      size="small"
                      variant={
                        isSaved
                          ? "outlined"
                          : "contained"
                      }
                      startIcon={
                        isSaved ? (
                          <CheckCircle
                            sx={{ fontSize: 14 }}
                          />
                        ) : (
                          <Save
                            sx={{ fontSize: 14 }}
                          />
                        )
                      }
                      onClick={() =>
                        handleSave(studentId)
                      }
                      disabled={
                        isRowSaving ||
                        savingAll ||
                        hasError
                      }
                      sx={isSaved ? btnSaved : btnSave}
                    >
                      {isRowSaving
                        ? "Saving..."
                        : isSaved
                        ? "Saved"
                        : "Save"}
                    </Button>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Paper>
      )}

      {/* CLASS RESULT SUMMARY */}

      {selectedExam && results.length > 0 && (
        <Box sx={{ mt: 1.5 }}>
          <Typography
            sx={{
              fontWeight: 800,
              mb: 0.75,
              color: COLORS.textDark,
              fontSize: 13,
            }}
          >
            Class Result Summary
          </Typography>

          <Paper
            elevation={0}
            sx={cardSx}
          >
            <TableContainer
              sx={{ overflowX: "auto" }}
            >
              <Table
                size="small"
                sx={{ minWidth: 380 }}
              >
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor:
                        COLORS.surfaceTint,
                    }}
                  >
                    <TableCell sx={headCellSx}>
                      Student
                    </TableCell>

                    <TableCell sx={headCellSx}>
                      Total
                    </TableCell>

                    <TableCell sx={headCellSx}>
                      Percentage
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {results.map((result) => (
                    <TableRow
                      key={result._id}
                      hover
                      sx={{
                        "& td": {
                          py: 0.45,
                        },
                      }}
                    >
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          fontSize: 12,
                        }}
                      >
                        {result.student?.name}
                      </TableCell>

                      <TableCell
                        sx={{ fontSize: 12 }}
                      >
                        {result.totalObtained}/
                        {result.totalMax}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={`${result.percentage}%`}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            height: 21,
                            fontSize: 10,
                            color:
                              result.percentage >=
                              40
                                ? COLORS.success
                                : COLORS.error,
                            backgroundColor:
                              result.percentage >=
                              40
                                ? COLORS.successSoft
                                : COLORS.errorSoft,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}
    </Box>
  );
}

// =====================================================
// EMPTY STATE
// =====================================================

function EmptyState({ title, subtitle }) {
  return (
    <Paper
      elevation={0}
      sx={{
        ...cardSx,
        textAlign: "center",
        py: { xs: 3, sm: 3.5 },
        px: 2,
      }}
    >
      <Avatar
        sx={{
          mx: "auto",
          mb: 0.75,
          width: 36,
          height: 36,
          bgcolor: COLORS.surfaceTint,
          color: COLORS.primary,
        }}
      >
        <Assessment sx={{ fontSize: 18 }} />
      </Avatar>

      <Typography
        fontWeight={700}
        fontSize={13}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          mt: 0.35,
          display: "block",
          fontSize: 10.5,
          color: COLORS.textMuted,
        }}
      >
        {subtitle}
      </Typography>
    </Paper>
  );
}

// =====================================================
// PAGE
// =====================================================

export default function TeacherResultsPage() {
  return (
    <PortalGuard allowedRoles={["TEACHER"]}>
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: COLORS.bgPage,
          px: {
            xs: 0.75,
            sm: 1.25,
            md: 1.75,
          },
          py: {
            xs: 1,
            md: 1.25,
          },
        }}
      >
        <Box
          sx={{
            maxWidth: 1100,
            mx: "auto",
          }}
        >
          <ResultsEntryContent />
        </Box>
      </Box>
    </PortalGuard>
  );
}

// =====================================================
// SHARED STYLES
// =====================================================

const cardSx = {
  mb: 1.25,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 1.75,
  overflow: "hidden",
  backgroundColor: "#fff",
};

const headCellSx = {
  fontWeight: 800,
  fontSize: 10.5,
  color: COLORS.textDark,
  whiteSpace: "nowrap",
  py: 0.65,
};

const selectSx = {
  minWidth: {
    sm: 190,
  },

  "& .MuiSelect-select": {
    py: 0.7,
    fontSize: 12,
  },

  "& .MuiOutlinedInput-root": {
    borderRadius: 1.25,
  },
};

const btnSave = {
  textTransform: "none",
  fontWeight: 700,
  fontSize: 11.5,

  background: `linear-gradient(
    135deg,
    ${COLORS.accent},
    ${COLORS.primaryDark}
  )`,

  boxShadow: "none",

  "&:hover": {
    background: `linear-gradient(
      135deg,
      ${COLORS.primary},
      ${COLORS.primaryDeep}
    )`,
    boxShadow: "none",
  },

  "&.Mui-disabled": {
    background: "#E5E1EF",
    color: "#A7A0BD",
  },
};

const btnSaveAll = {
  ...btnSave,

  background: `linear-gradient(
    135deg,
    ${COLORS.primaryDeep},
    ${COLORS.primary}
  )`,
};

const btnSaved = {
  textTransform: "none",
  fontWeight: 700,
  fontSize: 11.5,
  color: COLORS.success,
  borderColor: "#86EFAC",

  "&:hover": {
    borderColor: COLORS.success,
    backgroundColor: COLORS.successSoft,
  },
};

const successChipSx = {
  backgroundColor: COLORS.successSoft,
  color: COLORS.success,
  fontWeight: 700,
  height: 24,
  fontSize: 10.5,
};

const warningChipSx = {
  backgroundColor: COLORS.warningSoft,
  color: COLORS.warning,
  fontWeight: 700,
  height: 24,
  fontSize: 10.5,
};