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
  Checkbox,
  FormControlLabel,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import { Assessment, CheckCircle, DoneAll, Save, School } from "@mui/icons-material";

import { useClasses } from "@/hooks/useClasses";
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
};

export default function ResultsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const [classId, setClassId] = useState("");
  const [examId, setExamId] = useState("");

  const { data: examsData, isLoading: examsLoading } = useExamsByClass(classId);
  const exams = useMemo(() => examsData?.data || examsData?.exams || [], [examsData]);

  const { data: studentsData, isLoading: studentsLoading } = useStudentsByClass(classId);
  const students = studentsData?.students ?? [];

  const { data: results = [] } = useClassResults(examId);
  const { mutate: enterResult, isPending } = useEnterResult();

  const selectedExam = exams.find((e) => e._id === examId);

  // marksForm[studentId][subjectName][componentName] = value
  const [marksForm, setMarksForm] = useState({});
  const [absentMap, setAbsentMap] = useState({});
  const [savedIds, setSavedIds] = useState({});
  const [savingIds, setSavingIds] = useState({});
  const [savingAll, setSavingAll] = useState(false);

  useEffect(() => {
    setMarksForm({});
    setAbsentMap({});
    setSavedIds({});
  }, [examId]);

  const getStudentId = (stu) => stu.user?._id || stu._id;
  const getStudentName = (stu) => stu.user?.name || stu.name || "Unknown Student";

  const handleMarkChange = (studentId, subjectName, componentName, value) => {
    setMarksForm((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subjectName]: {
          ...prev[studentId]?.[subjectName],
          [componentName]: value,
        },
      },
    }));
    setSavedIds((prev) => ({ ...prev, [studentId]: false }));
  };

  const toggleAbsent = (studentId) => {
    setAbsentMap((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
    setSavedIds((prev) => ({ ...prev, [studentId]: false }));
  };

  const buildMarksPayload = (studentId) => {
    if (!selectedExam) return [];
    const isAbsent = Boolean(absentMap[studentId]);

    return selectedExam.subjects.map((s) => ({
      subject: s.subjectName,
      status: isAbsent ? "ABSENT" : "PRESENT",
      components: (s.components || []).map((c) => ({
        component: c.name,
        marksObtained: isAbsent ? 0 : Number(marksForm[studentId]?.[s.subjectName]?.[c.name] || 0),
      })),
    }));
  };

const getExistingComponentValue = (
  studentId,
  subjectName,
  componentName
) => {
  try {
    if (!studentId) return "";

    const safeResults = Array.isArray(results) ? results : [];

    const existingResult = safeResults.find((r) => {
      if (!r) return false;

      const resultStudentId =
        r?.student?._id ??
        r?.studentId?._id ??
        r?.studentId ??
        null;

      return (
        resultStudentId &&
        String(resultStudentId) === String(studentId)
      );
    });

    if (!existingResult) return "";

    const marks = Array.isArray(existingResult?.marks)
      ? existingResult.marks
      : [];

    const subjectMark = marks.find(
      (m) =>
        m &&
        m.subject &&
        String(m.subject) === String(subjectName)
    );

    if (!subjectMark) return "";

    const components = Array.isArray(subjectMark?.components)
      ? subjectMark.components
      : [];

    const compMark = components.find(
      (c) =>
        c &&
        c.component &&
        String(c.component) === String(componentName)
    );

    return compMark?.marksObtained ?? "";
  } catch (error) {
    console.error("RESULT VALUE ERROR:", {
      error,
      studentId,
      subjectName,
      componentName,
      results,
    });

    return "";
  }
};
  const handleSave = (studentId) => {
    if (!selectedExam) return;
    setSavingIds((prev) => ({ ...prev, [studentId]: true }));

    enterResult(
      { examId, studentId, marks: buildMarksPayload(studentId) },
      {
        onSuccess: () => setSavedIds((prev) => ({ ...prev, [studentId]: true })),
        onSettled: () => setSavingIds((prev) => ({ ...prev, [studentId]: false })),
      }
    );
  };

  const handleSaveAll = async () => {
    if (!selectedExam || !students.length) return;
    setSavingAll(true);

    for (const stu of students) {
      const studentId = getStudentId(stu);
      if (!studentId) continue;

      await new Promise((resolve) => {
        enterResult(
          { examId, studentId, marks: buildMarksPayload(studentId) },
          {
            onSuccess: () => setSavedIds((prev) => ({ ...prev, [studentId]: true })),
            onSettled: () => resolve(),
          }
        );
      });
    }

    setSavingAll(false);
  };

  const savedCount = useMemo(() => Object.values(savedIds).filter(Boolean).length, [savedIds]);

  return (
    <PageContainer>
      {/* HEADER */}
      <Box sx={{ mb: 2.5, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar
          sx={{
            width: { xs: 40, sm: 46 },
            height: { xs: 40, sm: 46 },
            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.primaryDark})`,
            color: "#fff",
            boxShadow: "0 4px 14px rgba(91,33,182,0.35)",
          }}
        >
          <Assessment fontSize="small" />
        </Avatar>
        <Box>
          <Typography sx={{ fontSize: { xs: 19, sm: 21, md: 25 }, fontWeight: 800, color: COLORS.textDark }}>
            Enter Results
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.textMuted, mt: 0.3 }}>
            Record marks for any class (admin access)
          </Typography>
        </Box>
      </Box>

      {/* FILTERS */}
      <Paper elevation={0} sx={cardSx}>
        <Box sx={{ px: { xs: 1.5, md: 2 }, py: 1.25, background: `linear-gradient(90deg, ${COLORS.primaryDeep}, ${COLORS.primaryDark})`, color: "#fff" }}>
          <Typography fontSize={14} fontWeight={800}>Select Class & Exam</Typography>
        </Box>

        <Box sx={{ p: { xs: 1.5, md: 2 } }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Select
              displayEmpty
              size="small"
              fullWidth={isMobile}
              value={classId}
              onChange={(e) => { setClassId(e.target.value); setExamId(""); }}
              disabled={classesLoading}
              sx={{ minWidth: { sm: 220 } }}
            >
              <MenuItem value="" disabled>{classesLoading ? "Loading classes..." : "Select Class"}</MenuItem>
              {classes.map((c) => (
                <MenuItem key={c._id} value={c._id}>{c.className} - {c.section}</MenuItem>
              ))}
            </Select>

            <Select
              displayEmpty
              size="small"
              fullWidth={isMobile}
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              disabled={!classId || examsLoading}
              sx={{ minWidth: { sm: 220 } }}
            >
              <MenuItem value="" disabled>{!classId ? "Select a class first" : examsLoading ? "Loading exams..." : "Select Exam"}</MenuItem>
              {exams.map((e) => (
                <MenuItem key={e._id} value={e._id}>{e.examName}</MenuItem>
              ))}
            </Select>

            {classId && (
              <Chip
                size="small"
                icon={<School sx={{ fontSize: 16 }} />}
                label={`${students.length} student${students.length === 1 ? "" : "s"}`}
                sx={{ alignSelf: { xs: "flex-start", sm: "center" }, backgroundColor: COLORS.surfaceTint, color: COLORS.primaryDark, fontWeight: 700 }}
              />
            )}
          </Stack>
        </Box>
      </Paper>

      {/* STATES */}
      {!classId && <EmptyState title="Choose a class to begin" subtitle="Select a class and exam above to start entering results." />}
      {classId && studentsLoading && (
        <Stack spacing={1}>
          <Skeleton variant="rounded" height={48} />
          <Skeleton variant="rounded" height={220} />
        </Stack>
      )}
      {classId && !studentsLoading && !students.length && <EmptyState title="No students found" subtitle="This class doesn't have any students yet." />}
      {classId && students.length > 0 && !examId && <EmptyState title="Select an exam" subtitle="Choose an exam above to enter or view marks." />}

      {/* RESULTS */}
      {selectedExam && students.length > 0 && (
        <Paper elevation={0} sx={cardSx}>
          <Box sx={{ px: { xs: 1.5, md: 2 }, py: 1.25, display: "flex", alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", gap: 1.25, flexWrap: "wrap" }}>
            <Box>
              <Typography fontSize={15} fontWeight={800} color="#1F2937">{selectedExam.examName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedExam.subjects.length} subject{selectedExam.subjects.length === 1 ? "" : "s"}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              {savedCount > 0 && (
                <Chip size="small" icon={<CheckCircle sx={{ fontSize: 16 }} />} label={`${savedCount} saved`} sx={{ backgroundColor: "#DCFCE7", color: "#166534", fontWeight: 700 }} />
              )}
              <Button
                size="small"
                variant="contained"
                startIcon={<DoneAll sx={{ fontSize: 16 }} />}
                onClick={handleSaveAll}
                disabled={savingAll || isPending}
                fullWidth={isMobile}
                sx={btnSaveAll}
              >
                {savingAll ? "Saving All..." : "Save All"}
              </Button>
            </Stack>
          </Box>

          <Divider />

          {!isMobile ? (
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: COLORS.surfaceTint }}>
                    <TableCell sx={headCellSx}>Student</TableCell>
                    <TableCell sx={headCellSx}>Absent</TableCell>
                    {selectedExam.subjects.map((s) => (
                      <TableCell key={s.subjectName} sx={headCellSx}>
                        {s.subjectName}
                        <Typography component="span" sx={{ display: "block", fontWeight: 500, fontSize: 11, color: COLORS.textMuted }}>
                          max {s.maxMarks}
                        </Typography>
                      </TableCell>
                    ))}
                    <TableCell sx={{ ...headCellSx, textAlign: "right" }}>Action</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {students.map((stu) => {
                    const studentId = getStudentId(stu);
                    const isSaved = savedIds[studentId];
                    const isRowSaving = savingIds[studentId];
                    const isAbsent = Boolean(absentMap[studentId]);
                    const name = getStudentName(stu);

                    return (
                      <TableRow key={`${studentId}-${examId}`} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                        <TableCell>
                          <Stack direction="row" spacing={1.2} alignItems="center">
                            <Avatar sx={{ width: 32, height: 32, bgcolor: COLORS.primary, fontSize: 13, fontWeight: 800 }}>
                              {name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" fontWeight={600}>{name}</Typography>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Checkbox size="small" checked={isAbsent} onChange={() => toggleAbsent(studentId)} />
                        </TableCell>

                        {selectedExam.subjects.map((s) => (
                          <TableCell key={s.subjectName}>
                            <Stack direction="row" spacing={0.75}>
                              {(s.components || []).map((c) => (
                                <TextField
                                  key={c.name}
                                  size="small"
                                  type="number"
                                  label={c.name}
                                  disabled={isAbsent}
                                  defaultValue={getExistingComponentValue(studentId, s.subjectName, c.name)}
                                  onChange={(e) => handleMarkChange(studentId, s.subjectName, c.name, e.target.value)}
                                  inputProps={{ min: 0, max: c.maxMarks, style: { textAlign: "center", width: 44 } }}
                                />
                              ))}
                            </Stack>
                          </TableCell>
                        ))}

                        <TableCell align="right">
                          <Button
                            size="small"
                            variant={isSaved ? "outlined" : "contained"}
                            startIcon={isSaved ? <CheckCircle sx={{ fontSize: 16 }} /> : <Save sx={{ fontSize: 16 }} />}
                            onClick={() => handleSave(studentId)}
                            disabled={isRowSaving || savingAll}
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
          ) : (
            <Stack divider={<Divider />}>
              {students.map((stu) => {
                const studentId = getStudentId(stu);
                const isSaved = savedIds[studentId];
                const isRowSaving = savingIds[studentId];
                const isAbsent = Boolean(absentMap[studentId]);
                const name = getStudentName(stu);

                return (
                  <Box key={`${studentId}-${examId}`} sx={{ p: 1.5 }}>
                    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1 }}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: COLORS.primary, fontSize: 13, fontWeight: 800 }}>
                        {name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" fontWeight={700} sx={{ flex: 1 }}>{name}</Typography>
                      {isSaved && <Chip size="small" icon={<CheckCircle sx={{ fontSize: 14 }} />} label="Saved" sx={{ backgroundColor: "#DCFCE7", color: "#166534", fontWeight: 700 }} />}
                    </Stack>

                    <FormControlLabel
                      control={<Checkbox size="small" checked={isAbsent} onChange={() => toggleAbsent(studentId)} />}
                      label={<Typography variant="caption">Absent for this exam</Typography>}
                      sx={{ mb: 1 }}
                    />

                    {selectedExam.subjects.map((s) => (
                      <Box key={s.subjectName} sx={{ mb: 1.25 }}>
                        <Typography variant="caption" fontWeight={700} sx={{ display: "block", mb: 0.5 }}>
                          {s.subjectName} (max {s.maxMarks})
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {(s.components || []).map((c) => (
                            <TextField
                              key={c.name}
                              size="small"
                              type="number"
                              label={`${c.name} (${c.maxMarks})`}
                              disabled={isAbsent}
                              defaultValue={getExistingComponentValue(studentId, s.subjectName, c.name)}
                              onChange={(e) => handleMarkChange(studentId, s.subjectName, c.name, e.target.value)}
                              inputProps={{ min: 0, max: c.maxMarks }}
                              sx={{ width: "calc(50% - 4px)" }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    ))}

                    <Button
                      fullWidth
                      size="small"
                      variant={isSaved ? "outlined" : "contained"}
                      startIcon={isSaved ? <CheckCircle sx={{ fontSize: 16 }} /> : <Save sx={{ fontSize: 16 }} />}
                      onClick={() => handleSave(studentId)}
                      disabled={isRowSaving || savingAll}
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

function EmptyState({ title, subtitle }) {
  return (
    <Paper elevation={0} sx={{ ...cardSx, textAlign: "center", py: { xs: 4.5, sm: 6 }, px: 2 }}>
      <Avatar sx={{ mx: "auto", mb: 1.5, width: 48, height: 48, bgcolor: COLORS.surfaceTint, color: COLORS.primary }}>
        <Assessment fontSize="small" />
      </Avatar>
      <Typography fontWeight={700}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>
    </Paper>
  );
}

function PageContainer({ children }) {
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: COLORS.bgPage, px: { xs: 1, sm: 2, md: 3 }, py: { xs: 1.5, md: 2.5 } }}>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>{children}</Box>
    </Box>
  );
}

const cardSx = { mb: 2.5, border: `1px solid ${COLORS.border}`, borderRadius: 2.5, overflow: "hidden", backgroundColor: "#fff" };
const headCellSx = { fontWeight: 800, fontSize: 12.5, color: COLORS.textDark, whiteSpace: "nowrap" };
const btnSave = { textTransform: "none", fontWeight: 700, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.primaryDark})`, boxShadow: "none" };
const btnSaveAll = { textTransform: "none", fontWeight: 700, background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "none" };
const btnSaved = { textTransform: "none", fontWeight: 700, color: "#166534", borderColor: "#86EFAC" };