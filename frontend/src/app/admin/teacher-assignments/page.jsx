"use client";

import { useMemo, useState } from "react";

import {
  Avatar,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import {
  Add,
  AssignmentTurnedInOutlined,
  CheckCircleOutline,
  ClassOutlined,
  Close,
  DeleteOutline,
  EditOutlined,
  PersonOutline,
  Search,
  SubjectOutlined,
} from "@mui/icons-material";

import { useClasses } from "@/hooks/useClasses";
import { usePrograms } from "@/hooks/useProgram";

import {
  useAssignTeacher,
  useAllAssignments,
  useRemoveAssignment,
  useUpdateAssignment,
} from "@/hooks/useTeacherAssignments";

import { useAllTeachers } from "@/hooks/useTeacher";

export default function TeacherAssignmentsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  /* =====================================================
     DATA
  ===================================================== */

  const { data: teacherResponse = [], isLoading: teachersLoading } = useAllTeachers();
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const { data: programs = [], isLoading: programsLoading } = usePrograms();

  const { data: assignments = [], isLoading: assignmentsLoading, isFetching: assignmentsFetching } = useAllAssignments();

  /* =====================================================
     MUTATIONS
  ===================================================== */

  const { mutate: assignTeacher, isPending: isAssigning } = useAssignTeacher();
  const { mutate: updateAssignment, isPending: isUpdating } = useUpdateAssignment();
  const { mutate: removeAssignment, isPending: isRemoving } = useRemoveAssignment();

  /* =====================================================
     TEACHERS NORMALIZATION
  ===================================================== */

  const teachers = useMemo(() => {
    if (Array.isArray(teacherResponse)) return teacherResponse;
    if (Array.isArray(teacherResponse?.data)) return teacherResponse.data;
    if (Array.isArray(teacherResponse?.teachers)) return teacherResponse.teachers;
    if (Array.isArray(teacherResponse?.users)) return teacherResponse.users;
    return [];
  }, [teacherResponse]);

  /* =====================================================
     FORM
  ===================================================== */

  const emptyForm = {
    teacherId: "",
    institutionType: "SCHOOL",
    classId: "",
    programId: "",
    semester: "",
    subject: "",
    isClassTeacher: false,
  };

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  /* =====================================================
     DIALOG
  ===================================================== */

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);

  /* =====================================================
     SEARCH / FILTER
  ===================================================== */

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  /* =====================================================
     HELPERS
  ===================================================== */

  const getTeacherName = (teacher) => teacher?.name || teacher?.user?.name || "Unknown Teacher";
  const getTeacherEmail = (teacher) => teacher?.email || teacher?.user?.email || "";
  const getTeacherId = (teacher) => teacher?.user?._id || teacher?._id || "";

  const getClassName = (classData) => {
    if (!classData) return "Unknown Class";
    return classData.className + (classData.section ? ` - ${classData.section}` : "");
  };

  const getAssignmentTargetLabel = (assignment) => {
    if (assignment.class) return getClassName(assignment.class);
    if (assignment.program) return `${assignment.program.name} — Sem ${assignment.semester || "-"}`;
    return "Unknown";
  };

  /* =====================================================
     OPEN CREATE / EDIT
  ===================================================== */

  const handleOpenCreate = () => {
    setEditingAssignment(null);
    setForm(emptyForm);
    setErrors({});
    setDialogOpen(true);
  };

  const handleOpenEdit = (assignment) => {
    setEditingAssignment(assignment);

    const isCollege = Boolean(assignment.program);

    setForm({
      teacherId: assignment.teacher?._id || "",
      institutionType: isCollege ? "COLLEGE" : "SCHOOL",
      classId: assignment.class?._id || "",
      programId: assignment.program?._id || "",
      semester: assignment.semester ?? "",
      subject: assignment.subject || "",
      isClassTeacher: Boolean(assignment.isClassTeacher),
    });

    setErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (isAssigning || isUpdating) return;
    setDialogOpen(false);
    setEditingAssignment(null);
    setForm(emptyForm);
    setErrors({});
  };

  /* =====================================================
     CHANGE
  ===================================================== */

  const handleChange = (field) => (event) => {
    const value = field === "isClassTeacher" ? event.target.checked : event.target.value;

    setForm((prev) => {
      const next = { ...prev, [field]: value };

      // institutionType switch hone par doosri type ke fields clear kar do
      if (field === "institutionType") {
        next.classId = "";
        next.programId = "";
        next.semester = "";
        next.isClassTeacher = false;
      }

      return next;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  /* =====================================================
     VALIDATION
  ===================================================== */

  const validateForm = () => {
    const newErrors = {};

    if (!form.teacherId) newErrors.teacherId = "Please select a teacher";

    if (form.institutionType === "SCHOOL") {
      if (!form.classId) newErrors.classId = "Please select a class";
      if (!form.isClassTeacher && !form.subject.trim()) newErrors.subject = "Subject is required";
    } else {
      if (!form.programId) newErrors.programId = "Please select a program";
      if (!form.semester) newErrors.semester = "Please select a semester";
      if (!form.subject.trim()) newErrors.subject = "Subject is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* =====================================================
     SUBMIT
  ===================================================== */

  const handleSubmit = () => {
    if (!validateForm()) return;

    const payload =
      form.institutionType === "SCHOOL"
        ? {
            teacherId: form.teacherId,
            classId: form.classId,
            subject: form.subject.trim(),
            isClassTeacher: Boolean(form.isClassTeacher),
          }
        : {
            teacherId: form.teacherId,
            programId: form.programId,
            semester: Number(form.semester),
            subject: form.subject.trim(),
          };

    if (editingAssignment) {
      updateAssignment(
        { id: editingAssignment._id, data: payload },
        { onSuccess: () => handleCloseDialog() }
      );
      return;
    }

    assignTeacher(payload, { onSuccess: () => handleCloseDialog() });
  };

  /* =====================================================
     REMOVE
  ===================================================== */

  const handleRemove = (id) => {
    if (!id || isRemoving) return;
    const confirmed = window.confirm("Are you sure you want to remove this teacher assignment?");
    if (!confirmed) return;
    removeAssignment(id);
  };

  /* =====================================================
     FILTERED ASSIGNMENTS
  ===================================================== */

  const filteredAssignments = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return assignments.filter((assignment) => {
      const teacherName = assignment.teacher?.name?.toLowerCase() || "";
      const teacherEmail = assignment.teacher?.email?.toLowerCase() || "";
      const className = assignment.class?.className?.toLowerCase() || "";
      const section = assignment.class?.section?.toLowerCase() || "";
      const programName = assignment.program?.name?.toLowerCase() || "";
      const subject = assignment.subject?.toLowerCase() || "";

      const matchesSearch =
        !searchValue ||
        teacherName.includes(searchValue) ||
        teacherEmail.includes(searchValue) ||
        className.includes(searchValue) ||
        section.includes(searchValue) ||
        programName.includes(searchValue) ||
        subject.includes(searchValue);

      const matchesClass = !classFilter || assignment.class?._id === classFilter;

      const matchesType =
        typeFilter === "ALL" ||
        (typeFilter === "CLASS_TEACHER" && assignment.isClassTeacher) ||
        (typeFilter === "SUBJECT_TEACHER" && !assignment.isClassTeacher);

      return matchesSearch && matchesClass && matchesType;
    });
  }, [assignments, search, classFilter, typeFilter]);

  /* =====================================================
     COUNTS
  ===================================================== */

  const classTeacherCount = assignments.filter((item) => item.isClassTeacher).length;
  const subjectTeacherCount = assignments.length - classTeacherCount;

  const pageLoading = teachersLoading || classesLoading || programsLoading;

  /* =====================================================
     UI
  ===================================================== */

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", p: { xs: 1.5, sm: 2.5, md: 3, lg: 4 } }}>
      {/* HEADER */}
      <Card elevation={0} sx={{ mb: 2.5, border: "1px solid #e5e7eb", borderRadius: 2.5, overflow: "hidden" }}>
        <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ width: 46, height: 46, bgcolor: "#7c3aed" }}>
                <AssignmentTurnedInOutlined />
              </Avatar>
              <Box>
                <Typography variant={isMobile ? "h6" : "h5"} fontWeight={800} color="#172033">
                  Teacher Assignments
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage teacher, class/program and subject assignments.
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenCreate}
              sx={{
                minHeight: 42,
                px: 2.2,
                borderRadius: 1.8,
                bgcolor: "#7c3aed",
                textTransform: "none",
                fontWeight: 700,
                boxShadow: "none",
                "&:hover": { bgcolor: "#6d28d9", boxShadow: "none" },
              }}
            >
              Assign Teacher
            </Button>
          </Stack>
        </Box>
      </Card>

      {/* STAT CARDS */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1.5, mb: 2.5 }}>
        <StatCard title="Total Assignments" value={assignments.length} icon={<AssignmentTurnedInOutlined />} />
        <StatCard title="Class Teachers" value={classTeacherCount} icon={<CheckCircleOutline />} />
        <StatCard title="Subject Teachers" value={subjectTeacherCount} icon={<SubjectOutlined />} />
      </Box>

      {/* TABLE CARD */}
      <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 2.5, bgcolor: "#fff", overflow: "hidden" }}>
        <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h6" fontWeight={750} sx={{ fontSize: { xs: 16, sm: 18 } }}>
                Assigned Teachers
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? "s" : ""} found
              </Typography>
            </Box>

            <Chip
              label={`${assignments.length} Active`}
              size="small"
              sx={{ width: "fit-content", bgcolor: "#f3e8ff", color: "#6d28d9", fontWeight: 700 }}
            />
          </Stack>
        </Box>

        <Divider />

        {/* FILTERS */}
        <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: "#fafafa" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1.5fr 1fr 1fr" }, gap: 1.5 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search teacher, class, program or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" fullWidth>
              <InputLabel>Class</InputLabel>
              <Select value={classFilter} label="Class" onChange={(e) => setClassFilter(e.target.value)}>
                <MenuItem value="">All Classes</MenuItem>
                {classes.map((item) => (
                  <MenuItem key={item._id} value={item._id}>
                    {getClassName(item)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>Assignment Type</InputLabel>
              <Select value={typeFilter} label="Assignment Type" onChange={(e) => setTypeFilter(e.target.value)}>
                <MenuItem value="ALL">All Types</MenuItem>
                <MenuItem value="CLASS_TEACHER">Class Teachers</MenuItem>
                <MenuItem value="SUBJECT_TEACHER">Subject Teachers</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Divider />

        {assignmentsLoading ? (
          <Box sx={{ minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress sx={{ color: "#7c3aed" }} />
          </Box>
        ) : filteredAssignments.length === 0 ? (
          <Box sx={{ py: 8, px: 2, textAlign: "center" }}>
            <Avatar sx={{ width: 58, height: 58, mx: "auto", mb: 1.5, bgcolor: "#f3e8ff", color: "#7c3aed" }}>
              <AssignmentTurnedInOutlined />
            </Avatar>
            <Typography fontWeight={750}>No assignments found</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Try changing your filters or assign a new teacher.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={handleOpenCreate}
              sx={{ mt: 2, textTransform: "none", borderColor: "#7c3aed", color: "#7c3aed" }}
            >
              Assign Teacher
            </Button>
          </Box>
        ) : isMobile ? (
          <Box sx={{ p: 1.5 }}>
            <Stack spacing={1.5}>
              {filteredAssignments.map((assignment) => {
                const teacherName = assignment.teacher?.name || "Unknown Teacher";
                const teacherEmail = assignment.teacher?.email || "";

                return (
                  <Box key={assignment._id} sx={{ border: "1px solid #e5e7eb", borderRadius: 2, p: 1.75 }}>
                    <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="space-between">
                      <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
                        <Avatar sx={{ width: 42, height: 42, bgcolor: "#ede9fe", color: "#7c3aed", fontWeight: 700 }}>
                          {teacherName.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box minWidth={0}>
                          <Typography variant="body2" fontWeight={750} noWrap>
                            {teacherName}
                          </Typography>
                          {teacherEmail && (
                            <Typography variant="caption" color="text.secondary" noWrap display="block">
                              {teacherEmail}
                            </Typography>
                          )}
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={0.5}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEdit(assignment)}
                          sx={{ color: "#7c3aed", bgcolor: "#faf5ff" }}
                        >
                          <EditOutlined fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={isRemoving}
                          onClick={() => handleRemove(assignment._id)}
                          sx={{ bgcolor: "#fef2f2" }}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>

                    <Divider sx={{ my: 1.5 }} />

                    <Stack spacing={1}>
                      <DetailRow label="Class/Program" value={getAssignmentTargetLabel(assignment)} />
                      <DetailRow label="Subject" value={assignment.subject || "—"} />
                      <DetailRow
                        label="Type"
                        value={assignment.isClassTeacher ? "Class Teacher" : "Subject Teacher"}
                        chip
                        success={assignment.isClassTeacher}
                      />
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        ) : (
          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <Table sx={{ minWidth: 780 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#fafafa" }}>
                  <TableCell sx={{ fontWeight: 750, color: "#475569" }}>Teacher</TableCell>
                  <TableCell sx={{ fontWeight: 750, color: "#475569" }}>Class / Program</TableCell>
                  <TableCell sx={{ fontWeight: 750, color: "#475569" }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 750, color: "#475569" }}>Type</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 750, color: "#475569" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredAssignments.map((assignment) => {
                  const teacherName = assignment.teacher?.name || "Unknown Teacher";
                  const teacherEmail = assignment.teacher?.email || "";

                  return (
                    <TableRow key={assignment._id} hover>
                      <TableCell sx={{ py: 1.5 }}>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Avatar sx={{ width: 38, height: 38, bgcolor: "#ede9fe", color: "#7c3aed", fontSize: 14, fontWeight: 700 }}>
                            {teacherName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>
                              {teacherName}
                            </Typography>
                            {teacherEmail && (
                              <Typography variant="caption" color="text.secondary">
                                {teacherEmail}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {getAssignmentTargetLabel(assignment)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" color={assignment.subject ? "text.primary" : "text.secondary"}>
                          {assignment.subject || "—"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={assignment.isClassTeacher ? "Class Teacher" : "Subject Teacher"}
                          color={assignment.isClassTeacher ? "success" : "default"}
                          variant={assignment.isClassTeacher ? "filled" : "outlined"}
                          sx={{ fontWeight: 650 }}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Edit Assignment">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEdit(assignment)}
                              sx={{
                                color: "#7c3aed",
                                border: "1px solid #ddd6fe",
                                bgcolor: "#fff",
                                "&:hover": { bgcolor: "#faf5ff" },
                              }}
                            >
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Remove Assignment">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={isRemoving}
                                onClick={() => handleRemove(assignment._id)}
                                sx={{
                                  border: "1px solid #fecaca",
                                  bgcolor: "#fff",
                                  "&:hover": { bgcolor: "#fef2f2" },
                                }}
                              >
                                <DeleteOutline fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}

        {assignmentsFetching && !assignmentsLoading && (
          <Box sx={{ borderTop: "1px solid #f1f5f9", py: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress size={15} sx={{ color: "#7c3aed" }} />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              Updating assignments...
            </Typography>
          </Box>
        )}
      </Card>

      {/* ASSIGN / EDIT DIALOG */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, overflow: "hidden" } }}
      >
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ px: 2.5, py: 2, bgcolor: "#faf5ff", borderBottom: "1px solid #ede9fe" }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Avatar sx={{ width: 40, height: 40, bgcolor: "#7c3aed" }}>
                  {editingAssignment ? <EditOutlined /> : <AssignmentTurnedInOutlined />}
                </Avatar>
                <Box>
                  <Typography fontWeight={800} fontSize={17}>
                    {editingAssignment ? "Edit Assignment" : "Assign Teacher"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {editingAssignment ? "Update teacher assignment details" : "Create a new teacher assignment"}
                  </Typography>
                </Box>
              </Stack>

              <IconButton onClick={handleCloseDialog} disabled={isAssigning || isUpdating}>
                <Close />
              </IconButton>
            </Stack>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          {pageLoading ? (
            <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
              <CircularProgress sx={{ color: "#7c3aed" }} />
            </Box>
          ) : (
            <Stack spacing={2.2} sx={{ mt: 1 }}>
              {/* TEACHER */}
              <FormControl fullWidth size="small" error={Boolean(errors.teacherId)}>
                <InputLabel>Teacher</InputLabel>
                <Select
                  value={form.teacherId}
                  label="Teacher"
                  onChange={handleChange("teacherId")}
                  startAdornment={<PersonOutline sx={{ color: "#7c3aed", mr: 1, fontSize: 20 }} />}
                  MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
                >
                  <MenuItem value="">
                    <em>Select Teacher</em>
                  </MenuItem>
                  {teachers.map((teacher) => {
                    const teacherId = getTeacherId(teacher);
                    if (!teacherId) return null;
                    const name = getTeacherName(teacher);
                    const email = getTeacherEmail(teacher);
                    return (
                      <MenuItem key={teacherId} value={teacherId}>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {name}
                          </Typography>
                          {email && (
                            <Typography variant="caption" color="text.secondary">
                              {email}
                            </Typography>
                          )}
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
                {errors.teacherId && <FormHelperText>{errors.teacherId}</FormHelperText>}
              </FormControl>

              {/* INSTITUTION TYPE TOGGLE */}
              <FormControl fullWidth size="small">
                <InputLabel>Institution Type</InputLabel>
                <Select value={form.institutionType} label="Institution Type" onChange={handleChange("institutionType")}>
                  <MenuItem value="SCHOOL">School</MenuItem>
                  <MenuItem value="COLLEGE">College</MenuItem>
                </Select>
              </FormControl>

              {/* SCHOOL: CLASS */}
              {form.institutionType === "SCHOOL" && (
                <FormControl fullWidth size="small" error={Boolean(errors.classId)}>
                  <InputLabel>Class</InputLabel>
                  <Select
                    value={form.classId}
                    label="Class"
                    onChange={handleChange("classId")}
                    startAdornment={<ClassOutlined sx={{ color: "#7c3aed", mr: 1, fontSize: 20 }} />}
                  >
                    <MenuItem value="">
                      <em>Select Class</em>
                    </MenuItem>
                    {classes.map((item) => (
                      <MenuItem key={item._id} value={item._id}>
                        {getClassName(item)}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.classId && <FormHelperText>{errors.classId}</FormHelperText>}
                </FormControl>
              )}

              {/* COLLEGE: PROGRAM + SEMESTER */}
              {form.institutionType === "COLLEGE" && (
                <>
                  <FormControl fullWidth size="small" error={Boolean(errors.programId)}>
                    <InputLabel>Program</InputLabel>
                    <Select
                      value={form.programId}
                      label="Program"
                      onChange={handleChange("programId")}
                      startAdornment={<ClassOutlined sx={{ color: "#7c3aed", mr: 1, fontSize: 20 }} />}
                    >
                      <MenuItem value="">
                        <em>Select Program</em>
                      </MenuItem>
                      {programs.map((program) => (
                        <MenuItem key={program._id} value={program._id}>
                          {program.name} {program.code ? `(${program.code})` : ""}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.programId && <FormHelperText>{errors.programId}</FormHelperText>}
                  </FormControl>

                  <FormControl fullWidth size="small" error={Boolean(errors.semester)}>
                    <InputLabel>Semester</InputLabel>
                    <Select value={form.semester} label="Semester" onChange={handleChange("semester")}>
                      <MenuItem value="">
                        <em>Select Semester</em>
                      </MenuItem>
                      {Array.from(
                        { length: programs.find((p) => p._id === form.programId)?.totalSemesters || 8 },
                        (_, i) => i + 1
                      ).map((sem) => (
                        <MenuItem key={sem} value={sem}>
                          Semester {sem}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.semester && <FormHelperText>{errors.semester}</FormHelperText>}
                  </FormControl>
                </>
              )}

              {/* SUBJECT */}
              <TextField
                fullWidth
                size="small"
                label="Subject"
                value={form.subject}
                onChange={handleChange("subject")}
                error={Boolean(errors.subject)}
                helperText={
                  errors.subject ||
                  (form.institutionType === "SCHOOL" && form.isClassTeacher ? "Optional for class teacher" : "Required")
                }
                placeholder="e.g. Mathematics"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SubjectOutlined sx={{ color: "#7c3aed", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />

              {/* CLASS TEACHER — sirf SCHOOL ke liye */}
              {form.institutionType === "SCHOOL" && (
                <Box
                  sx={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 2,
                    p: 1.5,
                    bgcolor: form.isClassTeacher ? "#faf5ff" : "#fff",
                  }}
                >
                  <FormControlLabel
                    sx={{ m: 0, alignItems: "flex-start" }}
                    control={
                      <Checkbox
                        checked={form.isClassTeacher}
                        onChange={handleChange("isClassTeacher")}
                        sx={{ color: "#7c3aed", "&.Mui-checked": { color: "#7c3aed" } }}
                      />
                    }
                    label={
                      <Box sx={{ pt: 0.4 }}>
                        <Typography variant="body2" fontWeight={700}>
                          Make Class Teacher
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          This teacher will become the in-charge of this class.
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, sm: 2.5 }, py: 1.75, borderTop: "1px solid #e5e7eb" }}>
          <Button onClick={handleCloseDialog} disabled={isAssigning || isUpdating} sx={{ textTransform: "none", color: "#475569" }}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isAssigning || isUpdating || pageLoading}
            startIcon={
              isAssigning || isUpdating ? (
                <CircularProgress size={17} color="inherit" />
              ) : editingAssignment ? (
                <CheckCircleOutline />
              ) : (
                <AssignmentTurnedInOutlined />
              )
            }
            sx={{
              minWidth: 150,
              minHeight: 40,
              bgcolor: "#7c3aed",
              textTransform: "none",
              fontWeight: 700,
              boxShadow: "none",
              "&:hover": { bgcolor: "#6d28d9", boxShadow: "none" },
            }}
          >
            {isAssigning ? "Assigning..." : isUpdating ? "Updating..." : editingAssignment ? "Update Assignment" : "Assign Teacher"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 2 }}>
      <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {title}
          </Typography>
          <Typography variant="h5" fontWeight={800} sx={{ mt: 0.25 }}>
            {value}
          </Typography>
        </Box>
        <Avatar sx={{ width: 40, height: 40, bgcolor: "#f3e8ff", color: "#7c3aed" }}>{icon}</Avatar>
      </Box>
    </Card>
  );
}

function DetailRow({ label, value, chip = false, success = false }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      {chip ? (
        <Chip size="small" label={value} color={success ? "success" : "default"} variant={success ? "filled" : "outlined"} sx={{ fontWeight: 650 }} />
      ) : (
        <Typography variant="body2" fontWeight={650} textAlign="right">
          {value}
        </Typography>
      )}
    </Stack>
  );
}