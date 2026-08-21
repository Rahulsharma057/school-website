"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import PortalGuard from "@/components/PortalGuard";
import ExcelResultImportExport from "@/components/ExcelResultImportExport";
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
  Checkbox,
  FormControlLabel,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import {
  Assessment,
  CheckCircle,
  DoneAll,
  Save,
  School,
  EditRounded,
  LockRounded,
} from "@mui/icons-material";

import { useMyAssignments } from "@/hooks/useTeacherAssignments";
import { useExamsByClass } from "@/hooks/useExam";
import { useStudentsByClass } from "@/hooks/useStudent";
import { useEnterResult, useClassResults } from "@/hooks/useResult";

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
  lockedBg: "#F9FAFB",
  lockedBorder: "#E5E7EB",
};

/* =========================================================
   HELPERS
========================================================= */

const normalizeId = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    return String(value?._id || value?.id || "");
  }

  return String(value);
};

/**
 * Exam subject can come in different forms:
 *
 * subject: "..."
 *
 * OR
 *
 * subject: {
 *   _id: "..."
 * }
 */
const getSubjectId = (subject) => {
  if (!subject) return "";

  const rawSubject =
    typeof subject === "object" ? (subject?.subject ?? subject) : subject;

  return normalizeId(rawSubject);
};

const getSubjectName = (subject, index = 0) => {
  return (
    String(
      subject?.subjectName || subject?.name || subject?.subject?.name || "",
    ).trim() || `Subject ${index + 1}`
  );
};

const getComponentName = (component, index = 0) => {
  return (
    String(component?.name || component?.title || "").trim() ||
    `Component ${index + 1}`
  );
};

const getStudentIdFromResult = (result) => {
  return normalizeId(
    result?.student?._id ||
      result?.studentId?._id ||
      result?.studentId ||
      result?.student,
  );
};

/**
 * IMPORTANT:
 * Never return empty key.
 */
const getSafeSubjectKey = (subject, index) => {
  const subjectId = getSubjectId(subject);

  if (subjectId) {
    return `subject-${subjectId}`;
  }

  return `subject-index-${index}`;
};

const getSafeComponentKey = (component, componentIndex, subjectIndex) => {
  const componentName = getComponentName(component, componentIndex);

  return `component-${subjectIndex}-${componentIndex}-${componentName}`;
};

/* =========================================================
   MAIN
========================================================= */
function ResultsEntryContent() {
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  /* =====================================================
     ASSIGNMENTS
  ===================================================== */

  const { data: assignments = [], isLoading: assignmentsLoading } =
    useMyAssignments();

  const myClasses = useMemo(() => {
    const map = new Map();

    assignments.forEach((assignment) => {
      const classId = assignment?.class?._id;

      if (classId) {
        map.set(String(classId), assignment.class);
      }
    });

    return [...map.values()];
  }, [assignments]);

  /* =====================================================
     CLASS / EXAM
  ===================================================== */

  const [classId, setClassId] = useState("");
  const [examId, setExamId] = useState("");

  const { data: examsData, isLoading: examsLoading } = useExamsByClass(classId);

  const exams = useMemo(() => {
    if (Array.isArray(examsData)) {
      return examsData;
    }

    return examsData?.data || examsData?.exams || [];
  }, [examsData]);

  const { data: studentsData, isLoading: studentsLoading } =
    useStudentsByClass(classId);

  const students = Array.isArray(studentsData)
    ? studentsData
    : (studentsData?.students ?? []);

  const { data: results = [], isLoading: resultsLoading } =
    useClassResults(examId);

  const { mutate: enterResult, isPending } = useEnterResult();

  const selectedExam = useMemo(() => {
    return exams.find((exam) => String(exam?._id) === String(examId));
  }, [exams, examId]);

  const examSubjects = useMemo(() => {
    if (!Array.isArray(selectedExam?.subjects)) {
      return [];
    }

    return selectedExam.subjects;
  }, [selectedExam]);

  /* =====================================================
     FORM STATE
  ===================================================== */

  const [marksForm, setMarksForm] = useState({});
  const [absentMap, setAbsentMap] = useState({});
  const [savedIds, setSavedIds] = useState({});
  const [savingIds, setSavingIds] = useState({});
  const [savingAll, setSavingAll] = useState(false);

  /*
    LOCKED IDS
    ---------------------------------------------------
    true  -> row is locked (read-only), showing "Edit" button
    false / undefined -> row is editable, showing "Save" button
  */
  const [lockedIds, setLockedIds] = useState({});

  /* =====================================================
     HYDRATION GUARD
     ---------------------------------------------------
     Prevents "Save All" / consecutive saves from wiping
     unsaved marks. queryClient.invalidateQueries in
     useEnterResult triggers a background refetch of
     `results` after EVERY save, which used to cause the
     "load existing results" effect below to overwrite
     the whole marksForm — deleting anything not yet
     saved. We now hydrate from `results` only once per
     exam, and re-arm when class/exam actually changes.
  ===================================================== */

  const hydratedForRef = useRef("");

  /* =====================================================
     RESET
  ===================================================== */

  useEffect(() => {
    setMarksForm({});
    setAbsentMap({});
    setSavedIds({});
    setSavingIds({});
    setLockedIds({});
    hydratedForRef.current = "";
  }, [classId, examId]);

  /* =====================================================
     STUDENT HELPERS
  ===================================================== */

  const getStudentId = (student) => {
    return normalizeId(
      student?.user?._id || student?._id || student?.user?.id || student?.id,
    );
  };

  const getStudentName = (student) => {
    return (
      student?.user?.name ||
      student?.name ||
      student?.fullName ||
      "Unknown Student"
    );
  };

  /* =====================================================
     FIND EXISTING STUDENT RESULT
  ===================================================== */

  const getExistingStudentResult = (studentId) => {
    if (!Array.isArray(results)) {
      return null;
    }

    return (
      results.find(
        (result) => getStudentIdFromResult(result) === String(studentId),
      ) || null
    );
  };

  /* =====================================================
     FIND EXISTING SUBJECT RESULT
  ===================================================== */

  const getExistingSubjectResult = (studentId, subjectId) => {
    const existingResult = getExistingStudentResult(studentId);

    if (!existingResult) {
      return null;
    }

    const marks = Array.isArray(existingResult?.marks)
      ? existingResult.marks
      : [];

    return (
      marks.find((mark) => {
        const existingSubjectId = normalizeId(
          mark?.subject?._id ||
            mark?.subjectId?._id ||
            mark?.subjectId ||
            mark?.subject,
        );

        return existingSubjectId === String(subjectId);
      }) || null
    );
  };

  /* =====================================================
     EXISTING COMPONENT VALUE
  ===================================================== */

  const getExistingComponentValue = (studentId, subjectId, componentName) => {
    const subjectResult = getExistingSubjectResult(studentId, subjectId);

    if (!subjectResult) {
      return "";
    }

    const components = Array.isArray(subjectResult?.components)
      ? subjectResult.components
      : [];

    const component = components.find((item) => {
      const existingName = String(
        item?.component?.name || item?.component || item?.name || "",
      )
        .trim()
        .toLowerCase();

      return (
        existingName ===
        String(componentName || "")
          .trim()
          .toLowerCase()
      );
    });

    if (!component) {
      return "";
    }

    return component?.marksObtained ?? component?.marks ?? "";
  };

  /* =====================================================
     EXISTING SIMPLE SUBJECT VALUE
  ===================================================== */

  const getExistingSimpleSubjectValue = (studentId, subjectId) => {
    const subjectResult = getExistingSubjectResult(studentId, subjectId);

    if (!subjectResult) {
      return "";
    }

    return subjectResult?.marksObtained ?? subjectResult?.marks ?? "";
  };

  /* =====================================================
     EXISTING STATUS
  ===================================================== */

  const getExistingSubjectStatus = (studentId, subjectId) => {
    const subjectResult = getExistingSubjectResult(studentId, subjectId);

    return subjectResult?.status || "PRESENT";
  };

  /* =====================================================
     LOAD EXISTING RESULTS
     (hydrates form ONCE per exam — see hydratedForRef)
  ===================================================== */

  useEffect(() => {
    if (
      !selectedExam ||
      !Array.isArray(students) ||
      !students.length ||
      !Array.isArray(results)
    ) {
      return;
    }

    if (!results.length) {
      return;
    }

    // Already hydrated for this exam -> don't let a
    // background refetch overwrite in-progress edits.
    if (hydratedForRef.current === examId) {
      return;
    }

    const nextMarksForm = {};
    const nextAbsentMap = {};
    const nextLockedIds = {};
    const nextSavedIds = {};

    students.forEach((student) => {
      const studentId = getStudentId(student);

      if (!studentId) {
        return;
      }

      const existingResult = getExistingStudentResult(studentId);

      if (!existingResult) {
        return;
      }

      const existingMarks = Array.isArray(existingResult?.marks)
        ? existingResult.marks
        : [];

      const hasAbsentSubject =
        existingMarks.length > 0 &&
        existingMarks.every((mark) => mark?.status === "ABSENT");

      nextAbsentMap[studentId] = hasAbsentSubject;

      const studentMarks = {};

      const examSubjectsList = Array.isArray(selectedExam?.subjects)
        ? selectedExam.subjects
        : [];

      examSubjectsList.forEach((subject, subjectIndex) => {
        const subjectId = getSubjectId(subject);

        if (!subjectId) {
          return;
        }

        const components = Array.isArray(subject?.components)
          ? subject.components
          : [];

        if (components.length > 0) {
          const componentValues = {};

          components.forEach((component, componentIndex) => {
            const componentName = getComponentName(component, componentIndex);

            const value = getExistingComponentValue(
              studentId,
              subjectId,
              componentName,
            );

            if (value !== "") {
              componentValues[componentName] = value;
            }
          });

          if (Object.keys(componentValues).length > 0) {
            studentMarks[subjectId] = componentValues;
          }
        } else {
          const value = getExistingSimpleSubjectValue(studentId, subjectId);

          if (value !== "") {
            studentMarks[subjectId] = {
              Marks: value,
            };
          }
        }
      });

      nextMarksForm[studentId] = studentMarks;

      // Already-saved result -> lock the row by default.
      nextLockedIds[studentId] = true;
      nextSavedIds[studentId] = true;
    });

    setMarksForm(nextMarksForm);
    setAbsentMap(nextAbsentMap);
    setLockedIds((prev) => ({ ...prev, ...nextLockedIds }));
    setSavedIds((prev) => ({ ...prev, ...nextSavedIds }));

    hydratedForRef.current = examId;
  }, [selectedExam, students, results, examId]);

  /* =====================================================
     HANDLE MARK CHANGE
  ===================================================== */

  const handleMarkChange = (studentId, subjectId, componentName, value) => {
    if (!studentId || !subjectId) {
      return;
    }

    setMarksForm((prev) => ({
      ...prev,

      [studentId]: {
        ...prev[studentId],

        [subjectId]: {
          ...prev[studentId]?.[subjectId],

          [componentName]: value,
        },
      },
    }));

    setSavedIds((prev) => ({
      ...prev,
      [studentId]: false,
    }));
  };

  /* =====================================================
     TOGGLE ABSENT
  ===================================================== */

  const toggleAbsent = (studentId) => {
    if (!studentId) {
      return;
    }

    // Locked (already-saved) row -> must hit Edit first
    if (lockedIds[studentId]) {
      return;
    }

    setAbsentMap((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));

    setSavedIds((prev) => ({
      ...prev,
      [studentId]: false,
    }));
  };

  /* =====================================================
     BUILD MARKS PAYLOAD
  ===================================================== */

  const buildMarksPayload = (studentId) => {
    if (!selectedExam) {
      return [];
    }

    const isAbsent = Boolean(absentMap[studentId]);

    const examSubjectsList = Array.isArray(selectedExam?.subjects)
      ? selectedExam.subjects
      : [];

    return examSubjectsList
      .map((subject) => {
        const subjectId = getSubjectId(subject);

        if (!subjectId) {
          return null;
        }

        const components = Array.isArray(subject?.components)
          ? subject.components
          : [];

        /* =============================================
           COMPONENT SUBJECT
        ============================================= */

        if (components.length > 0) {
          return {
            subject: subjectId,

            status: isAbsent ? "ABSENT" : "PRESENT",

            components: components.map((component, componentIndex) => {
              const componentName = getComponentName(component, componentIndex);

              const rawValue =
                marksForm?.[studentId]?.[subjectId]?.[componentName];

              const marksObtained =
                rawValue === undefined || rawValue === null || rawValue === ""
                  ? undefined
                  : Number(rawValue);

              return {
                component: componentName,

                ...(isAbsent
                  ? {
                      marksObtained: 0,
                      status: "ABSENT",
                    }
                  : {
                      ...(marksObtained !== undefined
                        ? {
                            marksObtained,
                          }
                        : {}),

                      status: "PRESENT",
                    }),
              };
            }),
          };
        }

        /* =============================================
           SIMPLE SUBJECT
        ============================================= */

        const rawValue = marksForm?.[studentId]?.[subjectId]?.Marks;

        const marksObtained =
          rawValue === undefined || rawValue === null || rawValue === ""
            ? undefined
            : Number(rawValue);

        return {
          subject: subjectId,

          status: isAbsent ? "ABSENT" : "PRESENT",

          ...(isAbsent
            ? {
                marksObtained: 0,
              }
            : marksObtained !== undefined
              ? {
                  marksObtained,
                }
              : {}),
        };
      })
      .filter(Boolean);
  };

  /* =====================================================
     SAVE SINGLE
  ===================================================== */

  const handleSave = (studentId) => {
    if (!selectedExam || !studentId) {
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

          // Lock the row right after a successful save.
          setLockedIds((prev) => ({
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

  /* =====================================================
     EDIT (UNLOCK) SINGLE ROW
  ===================================================== */

  const handleEdit = (studentId) => {
    if (!studentId) {
      return;
    }

    setLockedIds((prev) => ({
      ...prev,
      [studentId]: false,
    }));
  };

  /* =====================================================
     SAVE ALL
  ===================================================== */

  const handleSaveAll = async () => {
    if (!selectedExam || !students.length) {
      return;
    }

    setSavingAll(true);

    for (const student of students) {
      const studentId = getStudentId(student);

      if (!studentId) {
        continue;
      }

      // Skip rows that are already locked / saved and untouched.
      if (lockedIds[studentId]) {
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

              setLockedIds((prev) => ({
                ...prev,
                [studentId]: true,
              }));
            },

            onSettled: () => {
              resolve();
            },
          },
        );
      });
    }

    setSavingAll(false);
  };

  /* =====================================================
     SAVED COUNT
  ===================================================== */

  const savedCount = useMemo(() => {
    return Object.values(savedIds).filter(Boolean).length;
  }, [savedIds]);

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <Box>
      {/* =================================================
          HEADER
      ================================================= */}

      <Box
        sx={{
          mb: 2.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Avatar
          sx={{
            width: {
              xs: 40,
              sm: 46,
            },
            height: {
              xs: 40,
              sm: 46,
            },
            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.primaryDark})`,
            color: "#fff",
            boxShadow: "0 4px 14px rgba(91,33,182,0.35)",
          }}
        >
          <Assessment fontSize="small" />
        </Avatar>

        <Box>
          <Typography
            sx={{
              fontSize: {
                xs: 19,
                sm: 21,
                md: 25,
              },
              fontWeight: 800,
              color: COLORS.textDark,
            }}
          >
            Enter Results
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: COLORS.textMuted,
              mt: 0.3,
            }}
          >
            Enter marks for your assigned classes
          </Typography>
        </Box>
      </Box>

      {/* =================================================
          SELECT CLASS / EXAM
      ================================================= */}

      <Paper elevation={0} sx={cardSx}>
        <Box
          sx={{
            px: {
              xs: 1.5,
              md: 2,
            },
            py: 1.25,
            background: `linear-gradient(90deg, ${COLORS.primaryDeep}, ${COLORS.primaryDark})`,
            color: "#fff",
          }}
        >
          <Typography fontSize={14} fontWeight={800}>
            Select Class & Exam
          </Typography>
        </Box>

        <Box
          sx={{
            p: {
              xs: 1.5,
              md: 2,
            },
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1.5}
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
              sx={{
                minWidth: {
                  sm: 220,
                },
              }}
            >
              <MenuItem value="" disabled>
                {assignmentsLoading ? "Loading classes..." : "Select Class"}
              </MenuItem>

              {myClasses.map((classItem, index) => (
                <MenuItem
                  key={
                    classItem?._id
                      ? `class-${classItem._id}`
                      : `class-index-${index}`
                  }
                  value={classItem?._id || ""}
                >
                  {classItem?.className} - {classItem?.section}
                </MenuItem>
              ))}
            </Select>

            <Select
              displayEmpty
              size="small"
              fullWidth={isMobile}
              value={examId}
              onChange={(event) => setExamId(event.target.value)}
              disabled={!classId || examsLoading}
              sx={{
                minWidth: {
                  sm: 220,
                },
              }}
            >
              <MenuItem value="" disabled>
                {!classId
                  ? "Select a class first"
                  : examsLoading
                    ? "Loading exams..."
                    : "Select Exam"}
              </MenuItem>

              {exams.map((exam, index) => (
                <MenuItem
                  key={exam?._id ? `exam-${exam._id}` : `exam-index-${index}`}
                  value={exam?._id || ""}
                >
                  {exam?.examName}
                </MenuItem>
              ))}
            </Select>

            {classId && (
              <Chip
                size="small"
                icon={
                  <School
                    sx={{
                      fontSize: 16,
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
                }}
              />
            )}
          </Stack>
        </Box>
      </Paper>

      {/* =================================================
          EMPTY STATES
      ================================================= */}

      {!assignmentsLoading && myClasses.length === 0 && (
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
        <Stack spacing={1}>
          <Skeleton variant="rounded" height={48} />
          <Skeleton variant="rounded" height={220} />
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

      {/* =================================================
          EXCEL IMPORT / EXPORT
      ================================================= */}

      {selectedExam && examSubjects.length > 0 && students.length > 0 && (
        <ExcelResultImportExport
          examId={examId}
          examName={selectedExam.examName}
          subjects={examSubjects}
        />
      )}

      {/* =================================================
          RESULTS
      ================================================= */}

      {selectedExam && students.length > 0 && (
        <Paper elevation={0} sx={cardSx}>
          {/* HEADER */}

          <Box
            sx={{
              px: {
                xs: 1.5,
                md: 2,
              },
              py: 1.5,
              display: "flex",
              alignItems: {
                xs: "flex-start",
                sm: "center",
              },
              justifyContent: "space-between",
              gap: 1.5,
              flexWrap: "wrap",
              backgroundColor: "#fff",
            }}
          >
            <Box>
              <Typography fontSize={15} fontWeight={800} color="#1F2937">
                {selectedExam.examName}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                {selectedExam.subjects?.length} subject
                {selectedExam.subjects?.length === 1 ? "" : "s"}
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              {savedCount > 0 && (
                <Chip
                  size="small"
                  icon={
                    <CheckCircle
                      sx={{
                        fontSize: 16,
                      }}
                    />
                  }
                  label={`${savedCount} saved`}
                  sx={{
                    backgroundColor: "#DCFCE7",
                    color: "#166534",
                    fontWeight: 700,
                  }}
                />
              )}

              <Button
                size="small"
                variant="contained"
                startIcon={
                  <DoneAll
                    sx={{
                      fontSize: 16,
                    }}
                  />
                }
                onClick={handleSaveAll}
                disabled={savingAll || isPending}
                fullWidth={isMobile}
                sx={{
                  ...btnSaveAll,
                  minWidth: 140,
                }}
              >
                {savingAll ? "Saving All..." : "Save All"}
              </Button>
            </Stack>
          </Box>

          <Divider />

          {/* =================================================
                DESKTOP
            ================================================= */}

          {!isMobile ? (
            <TableContainer
              sx={{
                overflowX: "auto",
                maxHeight: 640,
              }}
            >
              <Table
                stickyHeader
                sx={{
                  minWidth: 720,
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={headCellSx}>Student</TableCell>

                    <TableCell sx={headCellSx}>Absent</TableCell>

                    {(selectedExam.subjects || []).map(
                      (subject, subjectIndex) => {
                        const subjectName = getSubjectName(
                          subject,
                          subjectIndex,
                        );

                        const subjectKey = getSafeSubjectKey(
                          subject,
                          subjectIndex,
                        );

                        return (
                          <TableCell
                            key={`header-${subjectKey}`}
                            sx={headCellSx}
                          >
                            {subjectName}

                            <Typography
                              component="span"
                              sx={{
                                display: "block",
                                fontWeight: 500,
                                fontSize: 11,
                                color: COLORS.textMuted,
                              }}
                            >
                              max {subject?.maxMarks}
                            </Typography>
                          </TableCell>
                        );
                      },
                    )}

                    <TableCell
                      sx={{
                        ...headCellSx,
                        textAlign: "right",
                        minWidth: 110,
                      }}
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {students.map((student, studentIndex) => {
                    const studentId = getStudentId(student);

                    if (!studentId) {
                      return null;
                    }

                    const isSaved = savedIds[studentId];

                    const isRowSaving = savingIds[studentId];

                    const isAbsent = Boolean(absentMap[studentId]);

                    const isLocked = Boolean(lockedIds[studentId]);

                    const isDisabled = isLocked || isRowSaving || savingAll;

                    const name = getStudentName(student);

                    return (
                      <TableRow
                        key={`student-row-${studentId}-${examId || studentIndex}`}
                        hover={!isLocked}
                        sx={{
                          "&:last-child td": {
                            borderBottom: 0,
                          },
                          backgroundColor: isLocked
                            ? COLORS.lockedBg
                            : "transparent",
                          transition: "background-color 0.15s ease",
                        }}
                      >
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={1.2}
                            alignItems="center"
                          >
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: isLocked
                                  ? COLORS.textMuted
                                  : COLORS.primary,
                                fontSize: 13,
                                fontWeight: 800,
                              }}
                            >
                              {name.charAt(0).toUpperCase()}
                            </Avatar>

                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {name}
                              </Typography>

                              {isLocked && (
                                <Stack
                                  direction="row"
                                  spacing={0.4}
                                  alignItems="center"
                                >
                                  <LockRounded
                                    sx={{
                                      fontSize: 12,
                                      color: COLORS.textMuted,
                                    }}
                                  />
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Saved · locked
                                  </Typography>
                                </Stack>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Checkbox
                            size="small"
                            checked={isAbsent}
                            disabled={isDisabled}
                            onChange={() => toggleAbsent(studentId)}
                          />
                        </TableCell>

                        {(selectedExam.subjects || []).map(
                          (subject, subjectIndex) => {
                            const subjectId = getSubjectId(subject);

                            const subjectKey = getSafeSubjectKey(
                              subject,
                              subjectIndex,
                            );

                            const subjectName = getSubjectName(
                              subject,
                              subjectIndex,
                            );

                            const components = Array.isArray(
                              subject?.components,
                            )
                              ? subject.components
                              : [];

                            /*
                             * If backend subject ID
                             * is missing, don't create
                             * broken form state.
                             */

                            if (!subjectId) {
                              return (
                                <TableCell
                                  key={`missing-subject-${studentId}-${subjectKey}`}
                                >
                                  <Typography variant="caption" color="error">
                                    Invalid subject
                                  </Typography>
                                </TableCell>
                              );
                            }

                            /* COMPONENT SUBJECT */

                            if (components.length > 0) {
                              return (
                                <TableCell
                                  key={`cell-${studentId}-${subjectKey}`}
                                >
                                  <Stack direction="row" spacing={0.75}>
                                    {components.map(
                                      (component, componentIndex) => {
                                        const componentName = getComponentName(
                                          component,
                                          componentIndex,
                                        );

                                        const componentKey =
                                          getSafeComponentKey(
                                            component,
                                            componentIndex,
                                            subjectIndex,
                                          );

                                        const value =
                                          marksForm?.[studentId]?.[subjectId]?.[
                                            componentName
                                          ] ??
                                          getExistingComponentValue(
                                            studentId,
                                            subjectId,
                                            componentName,
                                          );

                                        return (
                                          <TextField
                                            key={`${studentId}-${subjectKey}-${componentKey}`}
                                            size="small"
                                            type="number"
                                            label={componentName}
                                            value={isAbsent ? "" : value}
                                            disabled={isDisabled || isAbsent}
                                            onChange={(event) =>
                                              handleMarkChange(
                                                studentId,
                                                subjectId,
                                                componentName,
                                                event.target.value,
                                              )
                                            }
                                            inputProps={{
                                              min: 0,
                                              max: component?.maxMarks,
                                              style: {
                                                textAlign: "center",
                                                width: 44,
                                              },
                                            }}
                                          />
                                        );
                                      },
                                    )}
                                  </Stack>
                                </TableCell>
                              );
                            }

                            /* SIMPLE SUBJECT */

                            const simpleValue =
                              marksForm?.[studentId]?.[subjectId]?.Marks ??
                              getExistingSimpleSubjectValue(
                                studentId,
                                subjectId,
                              );

                            return (
                              <TableCell
                                key={`cell-${studentId}-${subjectKey}`}
                              >
                                <TextField
                                  size="small"
                                  type="number"
                                  label="Marks"
                                  value={isAbsent ? "" : simpleValue}
                                  disabled={isDisabled || isAbsent}
                                  onChange={(event) =>
                                    handleMarkChange(
                                      studentId,
                                      subjectId,
                                      "Marks",
                                      event.target.value,
                                    )
                                  }
                                  inputProps={{
                                    min: 0,
                                    max: subject?.maxMarks,
                                    style: {
                                      textAlign: "center",
                                      width: 60,
                                    },
                                  }}
                                />
                              </TableCell>
                            );
                          },
                        )}

                        <TableCell align="right">
                          {isLocked ? (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={
                                <EditRounded
                                  sx={{
                                    fontSize: 16,
                                  }}
                                />
                              }
                              onClick={() => handleEdit(studentId)}
                              disabled={savingAll}
                              sx={btnEdit}
                            >
                              Edit
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={
                                <Save
                                  sx={{
                                    fontSize: 16,
                                  }}
                                />
                              }
                              onClick={() => handleSave(studentId)}
                              disabled={isRowSaving || savingAll}
                              sx={btnSave}
                            >
                              {isRowSaving ? "..." : "Save"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            /* =================================================
                   MOBILE
              ================================================= */

            <Stack divider={<Divider />}>
              {students.map((student, studentIndex) => {
                const studentId = getStudentId(student);

                if (!studentId) {
                  return null;
                }

                const isSaved = savedIds[studentId];

                const isRowSaving = savingIds[studentId];

                const isAbsent = Boolean(absentMap[studentId]);

                const isLocked = Boolean(lockedIds[studentId]);

                const isDisabled = isLocked || isRowSaving || savingAll;

                const name = getStudentName(student);

                return (
                  <Box
                    key={`mobile-student-${studentId}-${examId || studentIndex}`}
                    sx={{
                      p: 1.75,
                      backgroundColor: isLocked
                        ? COLORS.lockedBg
                        : "transparent",
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.2}
                      alignItems="center"
                      sx={{
                        mb: 1.25,
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 34,
                          height: 34,
                          bgcolor: isLocked ? COLORS.textMuted : COLORS.primary,
                          fontSize: 13,
                          fontWeight: 800,
                        }}
                      >
                        {name.charAt(0).toUpperCase()}
                      </Avatar>

                      <Box
                        sx={{
                          flex: 1,
                        }}
                      >
                        <Typography variant="body2" fontWeight={700}>
                          {name}
                        </Typography>

                        {isLocked && (
                          <Stack
                            direction="row"
                            spacing={0.4}
                            alignItems="center"
                          >
                            <LockRounded
                              sx={{
                                fontSize: 12,
                                color: COLORS.textMuted,
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Locked
                            </Typography>
                          </Stack>
                        )}
                      </Box>

                      {isSaved && (
                        <Chip
                          size="small"
                          icon={
                            <CheckCircle
                              sx={{
                                fontSize: 14,
                              }}
                            />
                          }
                          label="Saved"
                          sx={{
                            backgroundColor: "#DCFCE7",
                            color: "#166534",
                            fontWeight: 700,
                          }}
                        />
                      )}
                    </Stack>

                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={isAbsent}
                          disabled={isDisabled}
                          onChange={() => toggleAbsent(studentId)}
                        />
                      }
                      label={
                        <Typography variant="caption">
                          Absent for this exam
                        </Typography>
                      }
                      sx={{
                        mb: 1,
                      }}
                    />

                    {(selectedExam.subjects || []).map(
                      (subject, subjectIndex) => {
                        const subjectId = getSubjectId(subject);

                        const subjectKey = getSafeSubjectKey(
                          subject,
                          subjectIndex,
                        );

                        const subjectName = getSubjectName(
                          subject,
                          subjectIndex,
                        );

                        const components = Array.isArray(subject?.components)
                          ? subject.components
                          : [];

                        if (!subjectId) {
                          return (
                            <Box
                              key={`mobile-invalid-${studentId}-${subjectKey}`}
                              sx={{
                                mb: 1.25,
                              }}
                            >
                              <Typography variant="caption" color="error">
                                Invalid subject
                              </Typography>
                            </Box>
                          );
                        }

                        return (
                          <Box
                            key={`mobile-subject-${studentId}-${subjectKey}`}
                            sx={{
                              mb: 1.5,
                            }}
                          >
                            <Typography
                              variant="caption"
                              fontWeight={700}
                              sx={{
                                display: "block",
                                mb: 0.6,
                              }}
                            >
                              {subjectName} (max {subject?.maxMarks})
                            </Typography>

                            <Stack
                              direction="row"
                              spacing={1}
                              flexWrap="wrap"
                              useFlexGap
                            >
                              {components.length > 0 ? (
                                components.map((component, componentIndex) => {
                                  const componentName = getComponentName(
                                    component,
                                    componentIndex,
                                  );

                                  const componentKey = getSafeComponentKey(
                                    component,
                                    componentIndex,
                                    subjectIndex,
                                  );

                                  const value =
                                    marksForm?.[studentId]?.[subjectId]?.[
                                      componentName
                                    ] ??
                                    getExistingComponentValue(
                                      studentId,
                                      subjectId,
                                      componentName,
                                    );

                                  return (
                                    <TextField
                                      key={`mobile-${studentId}-${subjectKey}-${componentKey}`}
                                      size="small"
                                      type="number"
                                      label={`${componentName} (${component?.maxMarks ?? 0})`}
                                      disabled={isDisabled || isAbsent}
                                      value={isAbsent ? "" : value}
                                      onChange={(event) =>
                                        handleMarkChange(
                                          studentId,
                                          subjectId,
                                          componentName,
                                          event.target.value,
                                        )
                                      }
                                      inputProps={{
                                        min: 0,
                                        max: component?.maxMarks,
                                      }}
                                      sx={{
                                        width: "calc(50% - 4px)",
                                      }}
                                    />
                                  );
                                })
                              ) : (
                                <TextField
                                  key={`mobile-simple-${studentId}-${subjectKey}`}
                                  size="small"
                                  type="number"
                                  label={`Marks (${subject?.maxMarks ?? 0})`}
                                  disabled={isDisabled || isAbsent}
                                  value={
                                    isAbsent
                                      ? ""
                                      : (marksForm?.[studentId]?.[subjectId]
                                          ?.Marks ??
                                        getExistingSimpleSubjectValue(
                                          studentId,
                                          subjectId,
                                        ))
                                  }
                                  onChange={(event) =>
                                    handleMarkChange(
                                      studentId,
                                      subjectId,
                                      "Marks",
                                      event.target.value,
                                    )
                                  }
                                  inputProps={{
                                    min: 0,
                                    max: subject?.maxMarks,
                                  }}
                                  sx={{
                                    width: "calc(50% - 4px)",
                                  }}
                                />
                              )}
                            </Stack>
                          </Box>
                        );
                      },
                    )}

                    {isLocked ? (
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        startIcon={
                          <EditRounded
                            sx={{
                              fontSize: 16,
                            }}
                          />
                        }
                        onClick={() => handleEdit(studentId)}
                        disabled={savingAll}
                        sx={btnEdit}
                      >
                        Edit
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        size="small"
                        variant="contained"
                        startIcon={
                          <Save
                            sx={{
                              fontSize: 16,
                            }}
                          />
                        }
                        onClick={() => handleSave(studentId)}
                        disabled={isRowSaving || savingAll}
                        sx={btnSave}
                      >
                        {isRowSaving ? "Saving..." : "Save"}
                      </Button>
                    )}
                  </Box>
                );
              })}
            </Stack>
          )}

          {resultsLoading && (
            <Box
              sx={{
                p: 1.5,
                borderTop: `1px solid ${COLORS.border}`,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Loading existing results...
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({ title, subtitle }) {
  return (
    <Paper
      elevation={0}
      sx={{
        ...cardSx,
        textAlign: "center",
        py: {
          xs: 4.5,
          sm: 6,
        },
        px: 2,
      }}
    >
      <Avatar
        sx={{
          mx: "auto",
          mb: 1.5,
          width: 48,
          height: 48,
          bgcolor: COLORS.surfaceTint,
          color: COLORS.primary,
        }}
      >
        <Assessment fontSize="small" />
      </Avatar>

      <Typography fontWeight={700}>{title}</Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mt: 0.5,
        }}
      >
        {subtitle}
      </Typography>
    </Paper>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function TeacherResultsPage() {
  return (
    <PortalGuard allowedRoles={["TEACHER"]}>
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: COLORS.bgPage,
          px: {
            xs: 1,
            sm: 2,
            md: 3,
          },
          py: {
            xs: 1.5,
            md: 2.5,
          },
        }}
      >
        <Box
          sx={{
            maxWidth: 1200,
            mx: "auto",
          }}
        >
          <ResultsEntryContent />
        </Box>
      </Box>
    </PortalGuard>
  );
}

/* =========================================================
   STYLES
========================================================= */

const cardSx = {
  mb: 2.5,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 3,
  overflow: "hidden",
  backgroundColor: "#fff",
  boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
};

const headCellSx = {
  fontWeight: 800,
  fontSize: 12.5,
  color: COLORS.textDark,
  whiteSpace: "nowrap",
  backgroundColor: COLORS.surfaceTint,
};

const btnSave = {
  textTransform: "none",
  fontWeight: 700,
  borderRadius: 2,
  minWidth: 88,
  background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.primaryDark})`,
  boxShadow: "none",
  "&:hover": {
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDeep})`,
    boxShadow: "none",
  },
};

const btnEdit = {
  textTransform: "none",
  fontWeight: 700,
  borderRadius: 2,
  minWidth: 88,
  color: COLORS.primaryDark,
  borderColor: COLORS.border,
  backgroundColor: "#fff",
  "&:hover": {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceTint,
  },
};

const btnSaveAll = {
  textTransform: "none",
  fontWeight: 700,
  borderRadius: 2,
  background: "linear-gradient(135deg, #16A34A, #15803D)",
  boxShadow: "none",
};