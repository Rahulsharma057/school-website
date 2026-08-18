"use client";

import { useState, useEffect, useMemo } from "react";

import {
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
  Save,
  School,
  WarningAmber,
} from "@mui/icons-material";

import { useClasses } from "@/hooks/useClasses";
import { useExamsByClass } from "@/hooks/useExam";
import { useStudentsByClass } from "@/hooks/useStudent";
import { useEnterResult, useClassResults } from "@/hooks/useResult";

import ExcelResultImportExport from "@/components/ExcelResultImportExport";

// =====================================================
// THEME
// =====================================================

const COLORS = {
  primary: "#5B21B6",
  primaryDark: "#4C1D95",
  primaryDeep: "#3B0764",
  accent: "#7C3AED",

  surfaceTint: "#FAF5FF",
  border: "#E9D5FF",
  bgPage: "#F8F7FC",

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

  const numberValue = Number(stringValue);

  if (!Number.isFinite(numberValue)) {
    return "Invalid";
  }

  if (numberValue < 0) {
    return "Can't be negative";
  }

  if (numberValue > Number(maxMarks)) {
    return `Maximum ${maxMarks} marks allowed`;
  }

  return "";
}

// Don't clamp.
// User's actual entered value stays visible.
function sanitizeMarkInput(value) {
  if (value === "") return "";

  return String(value).replace(/[^\d]/g, "");
}

// =====================================================
// PAGE
// =====================================================

export default function ResultsPage() {
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // =====================================================
  // DATA
  // =====================================================

  const { data: classes = [], isLoading: classesLoading } = useClasses();

  const [classId, setClassId] = useState("");
  const [examId, setExamId] = useState("");

  const { data: exams = [], isLoading: examsLoading } =
    useExamsByClass(classId);

  const { data: studentsData, isLoading: studentsLoading } =
    useStudentsByClass(classId);

  const students = studentsData?.students ?? [];

  const { data: results = [] } = useClassResults(examId);

  const { mutate: enterResult, isPending } = useEnterResult();

  const selectedExam = exams.find((exam) => exam._id === examId);

  // =====================================================
  // LOCAL STATE
  // =====================================================

  const [marksForm, setMarksForm] = useState({});
  const [savedIds, setSavedIds] = useState({});
  const [savingAll, setSavingAll] = useState(false);
  const [savingIds, setSavingIds] = useState({});

  // =====================================================
  // RESET WHEN EXAM CHANGES
  // =====================================================

  useEffect(() => {
    setMarksForm({});
    setSavedIds({});
    setSavingIds({});
  }, [examId]);

  // =====================================================
  // LOAD EXISTING RESULTS INTO FORM
  // =====================================================

  useEffect(() => {
    if (!selectedExam || !results.length) return;

    setMarksForm((prev) => {
      const next = { ...prev };

      results.forEach((result) => {
        const studentId = result.student?._id;

        if (!studentId) return;

        const existingStudentMarks = next[studentId] || {};

        const merged = {
          ...existingStudentMarks,
        };

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

  const getStudentId = (student) => student.user?._id || student._id;

  const getStudentName = (student) =>
    student.user?.name || student.name || "Unknown Student";

  const getMarkValue = (studentId, subject) =>
    marksForm[studentId]?.[subject] ?? "";

  // =====================================================
  // HANDLE MARK CHANGE
  // =====================================================

  const handleMarkChange = (studentId, subject, rawValue) => {
    const value = sanitizeMarkInput(rawValue);

    setMarksForm((prev) => ({
      ...prev,

      [studentId]: {
        ...(prev[studentId] || {}),
        [subject]: value,
      },
    }));

    setSavedIds((prev) => ({
      ...prev,
      [studentId]: false,
    }));
  };

  // =====================================================
  // GET ROW ERRORS
  // =====================================================

  const getRowErrors = (studentId) => {
    if (!selectedExam) return {};

    const errors = {};

    selectedExam.subjects.forEach((subject) => {
      const value = getMarkValue(studentId, subject.subject);

      const error = validateMark(value, subject.maxMarks);

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
  // INVALID STUDENT COUNT
  // =====================================================

  const invalidStudentCount = useMemo(() => {
    if (!selectedExam || !students.length) {
      return 0;
    }

    return students.reduce((count, student) => {
      const studentId = getStudentId(student);

      if (!studentId) return count;

      return hasRowErrors(studentId) ? count + 1 : count;
    }, 0);
  }, [students, selectedExam, marksForm]);

  // =====================================================
  // BUILD PAYLOAD
  // =====================================================

  const buildMarksPayload = (studentId) => {
    if (!selectedExam) return [];

    return selectedExam.subjects.map((subject) => ({
      subject: subject.subject,

      marksObtained: Number(getMarkValue(studentId, subject.subject)),
    }));
  };

  // =====================================================
  // SAVE SINGLE STUDENT
  // =====================================================

  const handleSave = (studentId) => {
    if (!selectedExam) return;

    // Stop if validation fails
    if (hasRowErrors(studentId)) {
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
      },
    );
  };

  // =====================================================
  // SAVE ALL
  // =====================================================

  const handleSaveAll = async () => {
    if (!selectedExam || !students.length) {
      return;
    }

    // Safety validation
    if (invalidStudentCount > 0) {
      return;
    }

    setSavingAll(true);

    for (const student of students) {
      const studentId = getStudentId(student);

      if (!studentId) continue;

      // Extra safety
      if (hasRowErrors(studentId)) {
        continue;
      }

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
          },
        );
      });
    }

    setSavingAll(false);
  };

  // =====================================================
  // SAVED COUNT
  // =====================================================

  const savedCount = useMemo(
    () => Object.values(savedIds).filter(Boolean).length,
    [savedIds],
  );

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <PageContainer>
      {/* ================= HEADER ================= */}

      <Box
        sx={{
          mb: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Avatar
          sx={{
            width: {
              xs: 34,
              sm: 38,
            },

            height: {
              xs: 34,
              sm: 38,
            },

            background: `linear-gradient(
              135deg,
              ${COLORS.accent},
              ${COLORS.primaryDark}
            )`,

            boxShadow: "0 3px 10px rgba(91,33,182,0.25)",
          }}
        >
          <Assessment
            sx={{
              fontSize: 19,
            }}
          />
        </Avatar>

        <Box>
          <Typography
            sx={{
              fontSize: {
                xs: 17,
                sm: 19,
                md: 21,
              },

              fontWeight: 800,
              color: COLORS.textDark,
              lineHeight: 1.1,
            }}
          >
            Enter Results
          </Typography>

          <Typography
            sx={{
              color: COLORS.textMuted,
              mt: 0.2,
              fontSize: {
                xs: 10.5,
                sm: 11.5,
              },
            }}
          >
            Record and manage student exam marks
          </Typography>
        </Box>
      </Box>

      {/* ================= FILTERS ================= */}

      <Paper elevation={0} sx={cardSx}>
        <Box
          sx={{
            px: 1.25,
            py: 0.75,

            background: `linear-gradient(
              90deg,
              ${COLORS.primaryDeep},
              ${COLORS.primaryDark}
            )`,

            color: "#fff",
          }}
        >
          <Typography fontSize={11.5} fontWeight={800}>
            Select Class & Exam
          </Typography>
        </Box>

        <Box
          sx={{
            p: 1.25,
          }}
        >
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
            {/* CLASS */}

            <Select
              displayEmpty
              size="small"
              fullWidth={isMobile}
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value);

                setExamId("");
              }}
              disabled={classesLoading}
              sx={selectSx}
            >
              <MenuItem value="" disabled>
                {classesLoading ? "Loading classes..." : "Select Class"}
              </MenuItem>

              {classes.map((item) => (
                <MenuItem key={item._id} value={item._id}>
                  {item.className} - {item.section}
                </MenuItem>
              ))}
            </Select>

            {/* EXAM */}

            <Select
              displayEmpty
              size="small"
              fullWidth={isMobile}
              value={examId}
              onChange={(event) => setExamId(event.target.value)}
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
                <MenuItem key={exam._id} value={exam._id}>
                  {exam.examName}
                </MenuItem>
              ))}
            </Select>

            {/* STUDENT COUNT */}

            {classId && (
              <Chip
                size="small"
                icon={
                  <School
                    sx={{
                      fontSize: 14,
                    }}
                  />
                }
                label={`${students.length} student${
                  students.length === 1 ? "" : "s"
                }`}
                sx={{
                  alignSelf: {
                    xs: "flex-start",
                    sm: "center",
                  },

                  backgroundColor: COLORS.surfaceTint,

                  color: COLORS.primaryDark,

                  fontWeight: 700,
                  height: 24,
                  fontSize: 10.5,
                }}
              />
            )}
          </Stack>
        </Box>
      </Paper>

      {/* ================= EXCEL ================= */}

      {selectedExam && (
        <ExcelResultImportExport
          examId={examId}
          examName={selectedExam.examName}
          subjects={selectedExam.subjects}
        />
      )}

      {/* ================= STATES ================= */}

      {!classId && (
        <EmptyState
          title="Choose a class to begin"
          subtitle="Select a class and exam above to start entering results."
        />
      )}

      {classId && studentsLoading && (
        <Stack spacing={0.75}>
          <Skeleton variant="rounded" height={36} />

          <Skeleton variant="rounded" height={170} />
        </Stack>
      )}

      {classId && !studentsLoading && !students.length && (
        <EmptyState
          title="No students found"
          subtitle="This class doesn't have any students yet."
        />
      )}

      {classId && students.length > 0 && !examId && (
        <EmptyState
          title="Select an exam"
          subtitle="Choose an exam above to enter or view marks."
        />
      )}

      {/* ================= RESULTS ================= */}

      {selectedExam && students.length > 0 && (
        <Paper elevation={0} sx={cardSx}>
          {/* PANEL HEADER */}

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

              gap: 0.75,
              flexWrap: "wrap",
            }}
          >
            <Box>
              <Typography fontSize={13} fontWeight={800} color="#1F2937">
                {selectedExam.examName}
              </Typography>

              <Typography
                sx={{
                  fontSize: 10,
                  color: COLORS.textMuted,
                }}
              >
                {selectedExam.subjects.length} subject
                {selectedExam.subjects.length === 1 ? "" : "s"}
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              {/* INVALID COUNT */}

              {invalidStudentCount > 0 && (
                <Chip
                  size="small"
                  icon={
                    <WarningAmber
                      sx={{
                        fontSize: 14,
                      }}
                    />
                  }
                  label={`${invalidStudentCount} invalid`}
                  sx={warningChipSx}
                />
              )}

              {/* SAVED COUNT */}

              {savedCount > 0 && (
                <Chip
                  size="small"
                  icon={
                    <CheckCircle
                      sx={{
                        fontSize: 14,
                      }}
                    />
                  }
                  label={`${savedCount} saved`}
                  sx={successChipSx}
                />
              )}

              {/* SAVE ALL */}

              <Button
                size="small"
                variant="contained"
                startIcon={
                  <DoneAll
                    sx={{
                      fontSize: 15,
                    }}
                  />
                }
                onClick={handleSaveAll}
                disabled={savingAll || isPending || invalidStudentCount > 0}
                fullWidth={isMobile}
                sx={btnSaveAll}
              >
                {savingAll ? "Saving..." : "Save All"}
              </Button>
            </Stack>
          </Box>

          {/* VALIDATION MESSAGE */}

          {invalidStudentCount > 0 && (
            <Box
              sx={{
                mx: 1.25,
                mb: 0.75,
                px: 1,
                py: 0.6,

                display: "flex",
                alignItems: "center",
                gap: 0.6,

                borderRadius: 1,
                backgroundColor: COLORS.warningSoft,

                border: `1px solid #FDE68A`,
              }}
            >
              <WarningAmber
                sx={{
                  fontSize: 16,
                  color: COLORS.warning,
                }}
              />

              <Typography
                sx={{
                  fontSize: 10.5,
                  color: COLORS.warning,
                  fontWeight: 600,
                }}
              >
                Fix invalid marks before saving all results.
              </Typography>
            </Box>
          )}

          <Divider />

          {/* =====================================================
                DESKTOP TABLE
            ===================================================== */}

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
                    borderColor: "#F0EAF8",
                  },
                }}
              >
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: COLORS.surfaceTint,
                    }}
                  >
                    <TableCell sx={headCellSx}>Student</TableCell>

                    {selectedExam.subjects.map((subject) => (
                      <TableCell key={subject.subject} sx={headCellSx}>
                        {subject.subject}

                        <Typography
                          component="span"
                          sx={{
                            display: "block",

                            fontWeight: 500,

                            fontSize: 9.5,

                            color: COLORS.textMuted,
                          }}
                        >
                          max {subject.maxMarks}
                        </Typography>
                      </TableCell>
                    ))}

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
                    const studentId = getStudentId(student);

                    const name = getStudentName(student);

                    const isSaved = savedIds[studentId];

                    const isRowSaving = savingIds[studentId];

                    const rowErrors = getRowErrors(studentId);

                    const hasError = Object.keys(rowErrors).length > 0;

                    return (
                      <TableRow
                        key={`${studentId}-${examId}`}
                        hover
                        sx={{
                          backgroundColor: hasError ? COLORS.errorSoft : "#fff",

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
                                width: 27,
                                height: 27,
                                bgcolor: COLORS.primary,
                                fontSize: 11,
                                fontWeight: 800,
                              }}
                            >
                              {name.charAt(0).toUpperCase()}
                            </Avatar>

                            <Typography fontSize={12} fontWeight={600} noWrap>
                              {name}
                            </Typography>
                          </Stack>
                        </TableCell>

                        {/* MARKS */}

                        {selectedExam.subjects.map((subject) => {
                          const value = getMarkValue(
                            studentId,
                            subject.subject,
                          );

                          const error = rowErrors[subject.subject];

                          const isOverMax =
                            Number(value) > Number(subject.maxMarks);

                          return (
                            <TableCell key={subject.subject}>
                              <TextField
                                size="small"
                                type="text"
                                inputMode="numeric"
                                value={value}
                                onChange={(event) =>
                                  handleMarkChange(
                                    studentId,
                                    subject.subject,
                                    event.target.value,
                                  )
                                }
                                error={!!error}
                                helperText={error || ""}
                                placeholder="—"
                                inputProps={{
                                  inputMode: "numeric",

                                  style: {
                                    textAlign: "center",
                                    padding: "5px 3px",
                                    fontSize: 12,
                                  },
                                }}
                                FormHelperTextProps={{
                                  sx: {
                                    fontSize: 8.5,
                                    m: 0,
                                    mt: 0.15,
                                    lineHeight: 1,
                                    whiteSpace: "nowrap",
                                  },
                                }}
                                sx={{
                                  width: 66,

                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: 1.25,

                                    backgroundColor: isOverMax
                                      ? COLORS.warningSoft
                                      : "#fff",
                                  },

                                  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                                    {
                                      borderColor: COLORS.accent,
                                    },
                                }}
                              />
                            </TableCell>
                          );
                        })}

                        {/* ACTION */}

                        <TableCell align="right">
                          <Button
                            size="small"
                            variant={isSaved ? "outlined" : "contained"}
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
                            onClick={() => handleSave(studentId)}
                            disabled={isRowSaving || savingAll || hasError}
                            sx={isSaved ? btnSaved : btnSave}
                          >
                            {isRowSaving ? "..." : isSaved ? "Saved" : "Save"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* =====================================================
                MOBILE CARDS
            ===================================================== */}

          {isMobile && (
            <Stack divider={<Divider />}>
              {students.map((student) => {
                const studentId = getStudentId(student);

                const name = getStudentName(student);

                const isSaved = savedIds[studentId];

                const isRowSaving = savingIds[studentId];

                const rowErrors = getRowErrors(studentId);

                const hasError = Object.keys(rowErrors).length > 0;

                return (
                  <Box
                    key={`${studentId}-${examId}`}
                    sx={{
                      p: 1,

                      backgroundColor: hasError ? COLORS.errorSoft : "#fff",
                    }}
                  >
                    {/* STUDENT */}

                    <Stack
                      direction="row"
                      spacing={0.75}
                      alignItems="center"
                      sx={{
                        mb: 0.75,
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 29,
                          height: 29,
                          bgcolor: COLORS.primary,
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {name.charAt(0).toUpperCase()}
                      </Avatar>

                      <Typography
                        fontSize={12.5}
                        fontWeight={700}
                        sx={{
                          flex: 1,
                        }}
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
                      sx={{
                        mb: 0.75,
                      }}
                    >
                      {selectedExam.subjects.map((subject) => {
                        const value = getMarkValue(studentId, subject.subject);

                        const error = rowErrors[subject.subject];

                        const isOverMax =
                          Number(value) > Number(subject.maxMarks);

                        return (
                          <TextField
                            key={subject.subject}
                            size="small"
                            type="text"
                            inputMode="numeric"
                            label={`${subject.subject} / ${subject.maxMarks}`}
                            value={value}
                            onChange={(event) =>
                              handleMarkChange(
                                studentId,
                                subject.subject,
                                event.target.value,
                              )
                            }
                            error={!!error}
                            helperText={error || ""}
                            inputProps={{
                              inputMode: "numeric",
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
                              width: "calc(50% - 4px)",

                              "& .MuiInputBase-input": {
                                fontSize: 12,
                                py: 0.7,
                              },

                              "& .MuiInputLabel-root": {
                                fontSize: 10.5,
                              },

                              "& .MuiOutlinedInput-root": {
                                borderRadius: 1.25,

                                backgroundColor: isOverMax
                                  ? COLORS.warningSoft
                                  : "#fff",
                              },
                            }}
                          />
                        );
                      })}
                    </Stack>

                    {/* SAVE */}

                    <Button
                      fullWidth
                      size="small"
                      variant={isSaved ? "outlined" : "contained"}
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
                      onClick={() => handleSave(studentId)}
                      disabled={isRowSaving || savingAll || hasError}
                      sx={isSaved ? btnSaved : btnSave}
                    >
                      {isRowSaving ? "Saving..." : isSaved ? "Saved" : "Save"}
                    </Button>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Paper>
      )}
    </PageContainer>
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
        py: {
          xs: 3.5,
          sm: 4.5,
        },
        px: 2,
      }}
    >
      <Avatar
        sx={{
          mx: "auto",
          mb: 1,
          width: 40,
          height: 40,
          bgcolor: COLORS.surfaceTint,
          color: COLORS.primary,
        }}
      >
        <Assessment
          sx={{
            fontSize: 19,
          }}
        />
      </Avatar>

      <Typography fontWeight={700} fontSize={13}>
        {title}
      </Typography>

      <Typography
        sx={{
          mt: 0.4,
          color: COLORS.textMuted,
          fontSize: 10.5,
        }}
      >
        {subtitle}
      </Typography>
    </Paper>
  );
}

// =====================================================
// PAGE CONTAINER
// =====================================================

function PageContainer({ children }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",

        backgroundColor: COLORS.bgPage,

        px: {
          xs: 0.75,
          sm: 1.5,
          md: 2,
        },

        py: {
          xs: 1,
          md: 1.5,
        },
      }}
    >
      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

// =====================================================
// STYLES
// =====================================================

const cardSx = {
  mb: 1.5,

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
    sm: 200,
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
  textTransform: "none",

  fontWeight: 700,

  fontSize: 11.5,

  background: `linear-gradient(
    135deg,
    ${COLORS.primaryDeep},
    ${COLORS.primary}
  )`,

  boxShadow: "none",

  "&:hover": {
    background: `linear-gradient(
      135deg,
      ${COLORS.primary},
      ${COLORS.accent}
    )`,

    boxShadow: "none",
  },

  "&.Mui-disabled": {
    background: "#E5E1EF",
    color: "#A7A0BD",
  },
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

  height: 23,

  fontSize: 10.5,
};

const warningChipSx = {
  backgroundColor: COLORS.warningSoft,

  color: COLORS.warning,

  fontWeight: 700,

  height: 23,

  fontSize: 10.5,
};
