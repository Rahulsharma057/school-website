"use client";

import { useMemo, useState } from "react";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  Add,
  CalendarMonth,
  Delete,
  Edit,
  Event,
  MenuBook,
  Search,
  School,
  Visibility,
} from "@mui/icons-material";

import {
  useCreateExam,
  useUpdateExam,
  useDeleteExam,
  useAllExams,
} from "@/hooks/useExam";

import { useClasses } from "@/hooks/useClasses";
import { useSubjects } from "@/hooks/useSubject";
import { usePrograms } from "@/hooks/useProgram";

// =====================================================
// CONSTANTS
// =====================================================

const PURPLE = "#6B12B7";

const EXAM_CATEGORIES = [
  { value: "PERIODIC_TEST", label: "Periodic Test" },
  { value: "UNIT_TEST", label: "Unit Test" },
  { value: "INTERNAL", label: "Internal" },
  { value: "MID_TERM", label: "Mid Term" },
  { value: "MID_SEMESTER", label: "Mid Semester" },
  { value: "HALF_YEARLY", label: "Half Yearly" },
  { value: "PRE_ANNUAL", label: "Pre Annual" },
  { value: "ANNUAL", label: "Annual" },
  { value: "END_SEMESTER", label: "End Semester" },
  { value: "PRACTICAL", label: "Practical" },
  { value: "PROJECT", label: "Project" },
  { value: "ASSIGNMENT", label: "Assignment" },
  { value: "OTHER", label: "Other" },
];

const SUBJECT_TYPES = [
  { value: "COMPULSORY", label: "Compulsory" },
  { value: "OPTIONAL", label: "Optional" },
  { value: "ELECTIVE", label: "Elective" },
  { value: "ADDITIONAL", label: "Additional" },
];

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "OPEN", label: "Open" },
  { value: "PUBLISHED", label: "Published" },
  { value: "LOCKED", label: "Locked" },
];

// =====================================================
// HELPERS
// =====================================================

const emptyComponent = () => ({
  name: "",
  maxMarks: "",
  passingMarks: "",
  weightage: 0,
});

const emptySubject = () => ({
  subject: "", // Subject master _id — dropdown se aayega
  subjectName: "",
  subjectCode: "",
  subjectType: "COMPULSORY",
  optionalGroup: "",
  components: [emptyComponent()],
  passingMarks: "",
  weightage: 100,
  isOptional: false,
});

const emptyForm = () => ({
  examName: "",
  examCode: "",
  academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,

  institutionType: "SCHOOL",

  classId: "",

  programId: "",
  semester: "",
  totalSemesters: "",

  examCategory: "OTHER",
  periodName: "",

  syllabusType: "FULL_SYLLABUS",
  syllabusDescription: "",

  subjects: [emptySubject()],

  calculationMethod: "DIRECT_TOTAL",
  passingType: "NONE",
  passingPercentage: 0,

  resultContribution: true,
  weightage: 100,
  isFinal: false,

  status: "DRAFT",

  startDate: "",
  endDate: "",
});

// =====================================================
// COMPONENT
// =====================================================

export default function ExamsPage() {
  const [search, setSearch] = useState("");
  const [institutionType, setInstitutionType] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  const [editingExam, setEditingExam] = useState(null);
  const [viewExam, setViewExam] = useState(null);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState(emptyForm());

  // ===================================================
  // HOOKS
  // ===================================================

  const { data, isLoading, isError, refetch } = useAllExams({
    ...(institutionType !== "ALL" ? { institutionType } : {}),
    ...(status !== "ALL" ? { status } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
  });

  const createMutation = useCreateExam();
  const updateMutation = useUpdateExam();
  const deleteMutation = useDeleteExam();

  const { data: classesData, isLoading: classesLoading } = useClasses();
  const { data: subjectsData, isLoading: subjectsLoading } = useSubjects();
  const { data: programsData, isLoading: programsLoading } = usePrograms();

  // ===================================================
  // NORMALIZE API DATA
  // ===================================================

  const exams = useMemo(() => data?.data || data?.exams || [], [data]);
  const classes = useMemo(() => classesData?.data || classesData?.classes || classesData || [], [classesData]);
  const subjects = useMemo(() => subjectsData || [], [subjectsData]);
  const programs = useMemo(() => programsData || [], [programsData]);

  // ===================================================
  // FORM HANDLERS
  // ===================================================

  const openCreate = () => {
    setEditingExam(null);
    setForm(emptyForm());
    setFormError("");
    setOpen(true);
  };

  const openEdit = (exam) => {
    setEditingExam(exam);

    setForm({
      examName: exam.examName || "",
      examCode: exam.examCode || "",
      academicYear: exam.academicYear || "",

      institutionType: exam.institutionType || "SCHOOL",

      classId: exam.class?._id || exam.class || "",

      programId: exam.program?._id || exam.program || "",
      semester: exam.semester ?? "",
      totalSemesters: exam.totalSemesters ?? "",

      examCategory: exam.examCategory || "OTHER",
      periodName: exam.periodName || "",

      syllabusType: exam.syllabusType || "FULL_SYLLABUS",
      syllabusDescription: exam.syllabusDescription || "",

      subjects: exam.subjects?.length
        ? exam.subjects.map((subject) => ({
            subject: subject.subject?._id || subject.subject || "",
            subjectName: subject.subjectName || subject.subject?.name || "",
            subjectCode: subject.subjectCode || subject.subject?.code || "",
            subjectType: subject.subjectType || "COMPULSORY",
            optionalGroup: subject.optionalGroup || "",
            components: subject.components?.length
              ? subject.components.map((component) => ({
                  name: component.name || "",
                  maxMarks: component.maxMarks ?? "",
                  passingMarks: component.passingMarks ?? "",
                  weightage: component.weightage ?? 0,
                }))
              : [emptyComponent()],
            passingMarks: subject.passingMarks ?? "",
            weightage: subject.weightage ?? 100,
            isOptional: Boolean(subject.isOptional),
          }))
        : [emptySubject()],

      calculationMethod: exam.calculationMethod || "DIRECT_TOTAL",
      passingType: exam.passingType || "NONE",
      passingPercentage: exam.passingPercentage ?? 0,

      resultContribution: exam.resultContribution !== false,
      weightage: exam.weightage ?? 100,
      isFinal: Boolean(exam.isFinal),

      status: exam.status || "DRAFT",

      startDate: exam.startDate ? new Date(exam.startDate).toISOString().slice(0, 10) : "",
      endDate: exam.endDate ? new Date(exam.endDate).toISOString().slice(0, 10) : "",
    });

    setFormError("");
    setOpen(true);
  };

  const closeDialog = () => {
    if (createMutation.isPending || updateMutation.isPending) return;
    setOpen(false);
    setEditingExam(null);
    setForm(emptyForm());
    setFormError("");
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ===================================================
  // PROGRAM SELECT — auto-fill totalSemesters
  // ===================================================

  const handleProgramChange = (programId) => {
    const selectedProgram = programs.find((p) => p._id === programId);
    setForm((prev) => ({
      ...prev,
      programId,
      totalSemesters: selectedProgram ? selectedProgram.totalSemesters : prev.totalSemesters,
    }));
  };

  // ===================================================
  // SUBJECT HANDLERS
  // ===================================================

  const addSubject = () => {
    setForm((prev) => ({ ...prev, subjects: [...prev.subjects, emptySubject()] }));
  };

  const removeSubject = (index) => {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }));
  };

  const updateSubject = (index, field, value) => {
    setForm((prev) => {
      const subjects = [...prev.subjects];
      subjects[index] = { ...subjects[index], [field]: value };
      return { ...prev, subjects };
    });
  };

  // Subject master se select hone par subjectName/subjectCode auto-fill
  const handleSubjectSelect = (index, subjectId) => {
    const selected = subjects.find((s) => s._id === subjectId);
    setForm((prev) => {
      const updatedSubjects = [...prev.subjects];
      updatedSubjects[index] = {
        ...updatedSubjects[index],
        subject: subjectId,
        subjectName: selected?.name || "",
        subjectCode: selected?.code || "",
      };
      return { ...prev, subjects: updatedSubjects };
    });
  };

  // ===================================================
  // COMPONENT HANDLERS
  // ===================================================

  const addComponent = (subjectIndex) => {
    setForm((prev) => {
      const subjects = [...prev.subjects];
      subjects[subjectIndex] = {
        ...subjects[subjectIndex],
        components: [...subjects[subjectIndex].components, emptyComponent()],
      };
      return { ...prev, subjects };
    });
  };

  const removeComponent = (subjectIndex, componentIndex) => {
    setForm((prev) => {
      const subjects = [...prev.subjects];
      const components = subjects[subjectIndex].components.filter((_, index) => index !== componentIndex);
      subjects[subjectIndex] = {
        ...subjects[subjectIndex],
        components: components.length ? components : [emptyComponent()],
      };
      return { ...prev, subjects };
    });
  };

  const updateComponent = (subjectIndex, componentIndex, field, value) => {
    setForm((prev) => {
      const subjects = [...prev.subjects];
      const components = [...subjects[subjectIndex].components];
      components[componentIndex] = { ...components[componentIndex], [field]: value };
      subjects[subjectIndex] = { ...subjects[subjectIndex], components };
      return { ...prev, subjects };
    });
  };

  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit = async () => {
    setFormError("");

    if (!form.examName.trim()) {
      setFormError("Exam name is required");
      return;
    }
    if (!form.academicYear.trim()) {
      setFormError("Academic year is required");
      return;
    }
    if (form.institutionType === "SCHOOL" && !form.classId) {
      setFormError("Class is required for school exam");
      return;
    }
    if (
      form.institutionType === "COLLEGE" &&
      (!form.programId || !form.semester || !form.totalSemesters)
    ) {
      setFormError("Program, semester and total semesters are required for college exam");
      return;
    }
    if (form.subjects.some((s) => !s.subject)) {
      setFormError("Please select a subject (from the dropdown) for every subject row");
      return;
    }

    const payload = {
      ...form,

      semester: form.institutionType === "COLLEGE" ? Number(form.semester) : null,
      totalSemesters: form.institutionType === "COLLEGE" ? Number(form.totalSemesters) : null,

      classId: form.institutionType === "SCHOOL" ? form.classId : null,
      programId: form.institutionType === "COLLEGE" ? form.programId : null,

      passingPercentage: Number(form.passingPercentage || 0),
      weightage: Number(form.weightage || 0),

      subjects: form.subjects.map((subject) => ({
        ...subject,
        subject: subject.subject,
        passingMarks: Number(subject.passingMarks || 0),
        weightage: Number(subject.weightage || 0),
        components: subject.components.map((component) => ({
          ...component,
          maxMarks: Number(component.maxMarks || 0),
          passingMarks: Number(component.passingMarks || 0),
          weightage: Number(component.weightage || 0),
        })),
      })),
    };

    try {
      if (editingExam) {
        await updateMutation.mutateAsync({ examId: editingExam._id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      closeDialog();
      refetch();
    } catch (error) {
      // mutation hook already toasts the error
    }
  };

  // ===================================================
  // DELETE
  // ===================================================

  const handleDelete = async (exam) => {
    const confirmed = window.confirm(`Delete "${exam.examName}"?`);
    if (!confirmed) return;
    await deleteMutation.mutateAsync(exam._id);
  };

  // ===================================================
  // VIEW
  // ===================================================

  const handleView = (exam) => {
    setViewExam(exam);
    setViewOpen(true);
  };

  // ===================================================
  // TOTAL MARKS
  // ===================================================

  const getSubjectTotal = (subject) =>
    subject.components?.reduce((total, component) => total + Number(component.maxMarks || 0), 0) || 0;

  const getExamTotal = (exam) =>
    exam.subjects?.reduce(
      (total, subject) => total + Number(subject.maxMarks || getSubjectTotal(subject) || 0),
      0
    ) || 0;

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7f8fc", p: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* HEADER */}
      <Card elevation={0} sx={{ borderRadius: 3, mb: 2, border: "1px solid #ececf2" }}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 }, "&:last-child": { pb: { xs: 2, md: 2.5 } } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
            spacing={2}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: PURPLE, width: 46, height: 46 }}>
                <Event />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: "1.2rem", md: "1.5rem" } }}>
                  Exams
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage school and college examinations
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openCreate}
              sx={{ bgcolor: PURPLE, borderRadius: 2, px: 2.5, py: 1.2, fontWeight: 700, "&:hover": { bgcolor: "#57109a" } }}
            >
              Create Exam
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* FILTERS */}
      <Card elevation={0} sx={{ borderRadius: 3, mb: 2, border: "1px solid #ececf2" }}>
        <CardContent>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search exam..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid size={{ xs: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <Select value={institutionType} onChange={(e) => setInstitutionType(e.target.value)}>
                  <MenuItem value="ALL">All Institutions</MenuItem>
                  <MenuItem value="SCHOOL">School</MenuItem>
                  <MenuItem value="COLLEGE">College</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <MenuItem value="ALL">All Status</MenuItem>
                  {STATUS_OPTIONS.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearch("");
                  setInstitutionType("ALL");
                  setStatus("ALL");
                }}
                sx={{ height: 40, borderRadius: 2 }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load exams.
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ minHeight: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress sx={{ color: PURPLE }} />
        </Box>
      ) : exams.length === 0 ? (
        <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #ececf2" }}>
          <CardContent sx={{ py: 7, textAlign: "center" }}>
            <Avatar sx={{ mx: "auto", mb: 2, bgcolor: "#f0e7f8", color: PURPLE, width: 60, height: 60 }}>
              <MenuBook />
            </Avatar>
            <Typography fontWeight={800} variant="h6">
              No Exams Found
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Create your first exam to get started.
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ bgcolor: PURPLE, borderRadius: 2 }}>
              Create Exam
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {exams.map((exam) => (
            <Grid key={exam._id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  border: "1px solid #ececf2",
                  transition: "all .2s ease",
                  "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 25px rgba(0,0,0,.07)" },
                }}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box>
                      <Typography fontWeight={800} sx={{ lineHeight: 1.3 }}>
                        {exam.examName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {exam.examCode || "No exam code"}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={exam.status}
                      color={
                        exam.status === "PUBLISHED"
                          ? "success"
                          : exam.status === "OPEN"
                          ? "info"
                          : exam.status === "LOCKED"
                          ? "error"
                          : "default"
                      }
                    />
                  </Stack>

                  <Divider sx={{ my: 1.5 }} />

                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <School fontSize="small" sx={{ color: PURPLE }} />
                      <Typography variant="body2">{exam.institutionType}</Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <CalendarMonth fontSize="small" sx={{ color: PURPLE }} />
                      <Typography variant="body2">{exam.academicYear}</Typography>
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      {EXAM_CATEGORIES.find((item) => item.value === exam.examCategory)?.label || exam.examCategory}
                    </Typography>

                    {exam.institutionType === "SCHOOL" ? (
                      <Typography variant="body2" color="text.secondary">
                        Class: {exam.class?.className || "N/A"}
                        {exam.class?.section ? ` - ${exam.class.section}` : ""}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {exam.program?.name || "Program"} — Semester {exam.semester || "N/A"}
                      </Typography>
                    )}

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip size="small" variant="outlined" label={`${exam.subjects?.length || 0} Subjects`} />
                      <Chip size="small" variant="outlined" label={`${getExamTotal(exam)} Marks`} />
                      {exam.isFinal && <Chip size="small" color="secondary" label="Final Exam" />}
                    </Stack>
                  </Stack>

                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button fullWidth size="small" variant="outlined" startIcon={<Visibility />} onClick={() => handleView(exam)}>
                      View
                    </Button>

                    <IconButton onClick={() => openEdit(exam)} sx={{ border: "1px solid #ddd", borderRadius: 2 }}>
                      <Edit fontSize="small" />
                    </IconButton>

                    <IconButton
                      color="error"
                      disabled={exam.status === "PUBLISHED" || exam.status === "LOCKED" || deleteMutation.isPending}
                      onClick={() => handleDelete(exam)}
                      sx={{ border: "1px solid #ddd", borderRadius: 2 }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* CREATE / EDIT DIALOG */}
      <Dialog
        open={open}
        onClose={closeDialog}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { borderRadius: { xs: 0, sm: 3 }, maxHeight: "95vh" } }}
      >
        <DialogTitle sx={{ bgcolor: PURPLE, color: "#fff", fontWeight: 800 }}>
          {editingExam ? "Edit Exam" : "Create Exam"}
        </DialogTitle>

        <DialogContent sx={{ bgcolor: "#f8f9fc", p: { xs: 1.5, sm: 2.5 } }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            {/* BASIC INFORMATION */}
            <Card elevation={0} sx={{ borderRadius: 2.5, border: "1px solid #e8e8ee" }}>
              <CardContent>
                <Typography fontWeight={800} sx={{ mb: 2 }}>
                  Basic Information
                </Typography>

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      required
                      label="Exam Name"
                      value={form.examName}
                      onChange={(e) => updateForm("examName", e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="Exam Code"
                      value={form.examCode}
                      onChange={(e) => updateForm("examCode", e.target.value.toUpperCase())}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="Academic Year"
                      value={form.academicYear}
                      onChange={(e) => updateForm("academicYear", e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      select
                      label="Institution"
                      value={form.institutionType}
                      onChange={(e) => updateForm("institutionType", e.target.value)}
                    >
                      <MenuItem value="SCHOOL">School</MenuItem>
                      <MenuItem value="COLLEGE">College</MenuItem>
                    </TextField>
                  </Grid>

                  {form.institutionType === "SCHOOL" ? (
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        select
                        label="Class"
                        value={form.classId}
                        onChange={(e) => updateForm("classId", e.target.value)}
                      >
                        {classesLoading ? (
                          <MenuItem disabled>Loading classes...</MenuItem>
                        ) : classes.length === 0 ? (
                          <MenuItem disabled>No classes found</MenuItem>
                        ) : (
                          classes.map((item) => (
                            <MenuItem key={item._id} value={item._id}>
                              {item.className}
                              {item.section ? ` - ${item.section}` : ""}
                            </MenuItem>
                          ))
                        )}
                      </TextField>
                    </Grid>
                  ) : (
                    <>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          select
                          label="Program"
                          value={form.programId}
                          onChange={(e) => handleProgramChange(e.target.value)}
                        >
                          {programsLoading ? (
                            <MenuItem disabled>Loading programs...</MenuItem>
                          ) : programs.length === 0 ? (
                            <MenuItem disabled>No programs found — create one first</MenuItem>
                          ) : (
                            programs.map((program) => (
                              <MenuItem key={program._id} value={program._id}>
                                {program.name} {program.code ? `(${program.code})` : ""}
                              </MenuItem>
                            ))
                          )}
                        </TextField>
                      </Grid>

                      <Grid size={{ xs: 6, md: 2 }}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Semester"
                          value={form.semester}
                          onChange={(e) => updateForm("semester", e.target.value)}
                        />
                      </Grid>

                      <Grid size={{ xs: 6, md: 2 }}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Total Semesters"
                          value={form.totalSemesters}
                          onChange={(e) => updateForm("totalSemesters", e.target.value)}
                          helperText="Auto-filled from program"
                        />
                      </Grid>
                    </>
                  )}

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      select
                      label="Exam Category"
                      value={form.examCategory}
                      onChange={(e) => updateForm("examCategory", e.target.value)}
                    >
                      {EXAM_CATEGORIES.map((item) => (
                        <MenuItem key={item.value} value={item.value}>
                          {item.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* SCHEDULE */}
            <Card elevation={0} sx={{ borderRadius: 2.5, border: "1px solid #e8e8ee" }}>
              <CardContent>
                <Typography fontWeight={800} sx={{ mb: 2 }}>
                  Exam Schedule
                </Typography>

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Start Date"
                      InputLabelProps={{ shrink: true }}
                      value={form.startDate}
                      onChange={(e) => updateForm("startDate", e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="End Date"
                      InputLabelProps={{ shrink: true }}
                      value={form.endDate}
                      onChange={(e) => updateForm("endDate", e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Period Name"
                      placeholder="Term 1 / Semester Exam"
                      value={form.periodName}
                      onChange={(e) => updateForm("periodName", e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* SUBJECTS */}
            <Card elevation={0} sx={{ borderRadius: 2.5, border: "1px solid #e8e8ee" }}>
              <CardContent>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
                  <Box>
                    <Typography fontWeight={800}>Subjects & Marks</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Select from the subject master list; name/code auto-fill.
                    </Typography>
                  </Box>

                  <Button
                    startIcon={<Add />}
                    variant="outlined"
                    onClick={addSubject}
                    sx={{ borderColor: PURPLE, color: PURPLE, borderRadius: 2 }}
                  >
                    Add Subject
                  </Button>
                </Stack>

                <Stack spacing={2}>
                  {form.subjects.map((subject, subjectIndex) => (
                    <Paper key={subjectIndex} elevation={0} sx={{ p: { xs: 1.5, md: 2 }, border: "1px solid #e2e2e8", borderRadius: 2.5 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                        <Typography fontWeight={800}>Subject {subjectIndex + 1}</Typography>
                        {form.subjects.length > 1 && (
                          <IconButton color="error" onClick={() => removeSubject(subjectIndex)}>
                            <Delete />
                          </IconButton>
                        )}
                      </Stack>

                      <Grid container spacing={1.5}>
                        {/* SUBJECT — dropdown from master list */}
                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            required
                            select
                            label="Subject"
                            value={subject.subject}
                            onChange={(e) => handleSubjectSelect(subjectIndex, e.target.value)}
                          >
                            {subjectsLoading ? (
                              <MenuItem disabled>Loading subjects...</MenuItem>
                            ) : subjects.length === 0 ? (
                              <MenuItem disabled>No subjects found — create one first</MenuItem>
                            ) : (
                              subjects.map((s) => (
                                <MenuItem key={s._id} value={s._id}>
                                  {s.name} {s.code ? `(${s.code})` : ""}
                                </MenuItem>
                              ))
                            )}
                          </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            fullWidth
                            label="Subject Code"
                            value={subject.subjectCode}
                            disabled
                            helperText="From subject master"
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            fullWidth
                            select
                            label="Subject Type"
                            value={subject.subjectType}
                            onChange={(e) => updateSubject(subjectIndex, "subjectType", e.target.value)}
                          >
                            {SUBJECT_TYPES.map((item) => (
                              <MenuItem key={item.value} value={item.value}>
                                {item.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>

                        <Grid size={{ xs: 6, md: 2 }}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Passing Marks"
                            value={subject.passingMarks}
                            onChange={(e) => updateSubject(subjectIndex, "passingMarks", e.target.value)}
                          />
                        </Grid>

                        <Grid size={{ xs: 6, md: 2 }}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Weightage %"
                            value={subject.weightage}
                            onChange={(e) => updateSubject(subjectIndex, "weightage", e.target.value)}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 2 }}>
                          <Chip label={`${getSubjectTotal(subject)} Marks`} sx={{ height: 40, width: "100%" }} />
                        </Grid>
                      </Grid>

                      {/* COMPONENTS */}
                      <Box sx={{ mt: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="body2" fontWeight={700}>
                            Components
                          </Typography>
                          <Button size="small" startIcon={<Add />} onClick={() => addComponent(subjectIndex)}>
                            Add Component
                          </Button>
                        </Stack>

                        <Stack spacing={1}>
                          {subject.components.map((component, componentIndex) => (
                            <Paper key={componentIndex} elevation={0} sx={{ p: 1, bgcolor: "#f8f8fb", borderRadius: 2 }}>
                              <Grid container spacing={1} alignItems="center">
                                <Grid size={{ xs: 12, sm: 5, md: 4 }}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    label="Component"
                                    placeholder="Theory"
                                    value={component.name}
                                    onChange={(e) => updateComponent(subjectIndex, componentIndex, "name", e.target.value)}
                                  />
                                </Grid>

                                <Grid size={{ xs: 6, sm: 2 }}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    type="number"
                                    label="Max"
                                    value={component.maxMarks}
                                    onChange={(e) => updateComponent(subjectIndex, componentIndex, "maxMarks", e.target.value)}
                                  />
                                </Grid>

                                <Grid size={{ xs: 6, sm: 2 }}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    type="number"
                                    label="Pass"
                                    value={component.passingMarks}
                                    onChange={(e) => updateComponent(subjectIndex, componentIndex, "passingMarks", e.target.value)}
                                  />
                                </Grid>

                                <Grid size={{ xs: 10, sm: 2 }}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    type="number"
                                    label="Weightage"
                                    value={component.weightage}
                                    onChange={(e) => updateComponent(subjectIndex, componentIndex, "weightage", e.target.value)}
                                  />
                                </Grid>

                                <Grid size={{ xs: 2, sm: 1 }}>
                                  <IconButton color="error" onClick={() => removeComponent(subjectIndex, componentIndex)}>
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Grid>
                              </Grid>
                            </Paper>
                          ))}
                        </Stack>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* RESULT SETTINGS */}
            <Card elevation={0} sx={{ borderRadius: 2.5, border: "1px solid #e8e8ee" }}>
              <CardContent>
                <Typography fontWeight={800} sx={{ mb: 2 }}>
                  Result Settings
                </Typography>

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      select
                      label="Calculation Method"
                      value={form.calculationMethod}
                      onChange={(e) => updateForm("calculationMethod", e.target.value)}
                    >
                      <MenuItem value="DIRECT_TOTAL">Direct Total</MenuItem>
                      <MenuItem value="WEIGHTED">Weighted</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      select
                      label="Passing Type"
                      value={form.passingType}
                      onChange={(e) => updateForm("passingType", e.target.value)}
                    >
                      <MenuItem value="NONE">None</MenuItem>
                      <MenuItem value="PERCENTAGE">Percentage</MenuItem>
                      <MenuItem value="MARKS">Marks</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Passing Percentage"
                      value={form.passingPercentage}
                      disabled={form.passingType !== "PERCENTAGE"}
                      onChange={(e) => updateForm("passingPercentage", e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      select
                      label="Status"
                      value={form.status}
                      onChange={(e) => updateForm("status", e.target.value)}
                    >
                      {STATUS_OPTIONS.map((item) => (
                        <MenuItem key={item.value} value={item.value}>
                          {item.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Exam Weightage % (for final result)"
                      value={form.weightage}
                      onChange={(e) => updateForm("weightage", e.target.value)}
                      helperText="e.g. Half Yearly 30, Annual 70"
                    />
                  </Grid>

                  <Grid size={{ xs: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      select
                      label="Contributes to Final Result?"
                      value={form.resultContribution ? "yes" : "no"}
                      onChange={(e) => updateForm("resultContribution", e.target.value === "yes")}
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No (practice exam)</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      select
                      label="Is this the Final Exam?"
                      value={form.isFinal ? "yes" : "no"}
                      onChange={(e) => updateForm("isFinal", e.target.value === "yes")}
                      helperText="e.g. Annual / End Semester"
                    >
                      <MenuItem value="no">No</MenuItem>
                      <MenuItem value="yes">Yes</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label="Syllabus Description"
                      value={form.syllabusDescription}
                      onChange={(e) => updateForm("syllabusDescription", e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: "1px solid #eee" }}>
          <Button onClick={closeDialog} disabled={createMutation.isPending || updateMutation.isPending}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
            sx={{ bgcolor: PURPLE, borderRadius: 2, px: 3 }}
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <CircularProgress size={22} sx={{ color: "#fff" }} />
            ) : editingExam ? (
              "Update Exam"
            ) : (
              "Create Exam"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIEW DIALOG */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Exam Details</DialogTitle>

        <DialogContent>
          {viewExam && (
            <Stack spacing={2}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: "#f8f5fb" }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>
                      {viewExam.examName}
                    </Typography>
                    <Typography color="text.secondary">{viewExam.examCode || "No Code"}</Typography>
                  </Box>
                  <Chip label={viewExam.status} />
                </Stack>
              </Paper>

              <Grid container spacing={1.5}>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Institution
                  </Typography>
                  <Typography fontWeight={700}>{viewExam.institutionType}</Typography>
                </Grid>

                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Academic Year
                  </Typography>
                  <Typography fontWeight={700}>{viewExam.academicYear}</Typography>
                </Grid>

                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Category
                  </Typography>
                  <Typography fontWeight={700}>
                    {EXAM_CATEGORIES.find((item) => item.value === viewExam.examCategory)?.label || viewExam.examCategory}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Total Marks
                  </Typography>
                  <Typography fontWeight={700}>{getExamTotal(viewExam)}</Typography>
                </Grid>
              </Grid>

              <Divider />

              <Typography fontWeight={800}>Subjects</Typography>

              <Stack spacing={1.5}>
                {viewExam.subjects?.map((subject, index) => (
                  <Paper key={index} elevation={0} sx={{ p: 1.5, border: "1px solid #e5e5ea", borderRadius: 2 }}>
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                      <Box>
                        <Typography fontWeight={800}>{subject.subjectName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {subject.subjectCode} • {subject.subjectType}
                        </Typography>
                      </Box>
                      <Chip size="small" label={`${subject.maxMarks || getSubjectTotal(subject)} Marks`} />
                    </Stack>

                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                      {subject.components?.map((component, componentIndex) => (
                        <Stack key={componentIndex} direction="row" justifyContent="space-between">
                          <Typography variant="body2">{component.name}</Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {component.maxMarks} marks
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setViewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}