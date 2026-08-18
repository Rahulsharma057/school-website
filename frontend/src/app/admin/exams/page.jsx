"use client";

import { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Select,
  MenuItem,
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
  Add,
  Delete,
  Edit,
  Save,
  Close,
  School,
} from "@mui/icons-material";

import { useClasses } from "@/hooks/useClasses";

import {
  useCreateExam,
  useExamsByClass,
  useUpdateExam,
} from "@/hooks/useExam";

const C = {
  primary: "#4C1D95",
  violet: "#6D28D9",
  light: "#F5F3FF",
  page: "#F7F5FB",
  border: "#DDD6FE",
  text: "#1F1B2D",
  muted: "#6B7280",
};

const EMPTY = { subject: "", maxMarks: "" };

export default function ExamsPage() {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { data: classes = [], isLoading: classesLoading } =
    useClasses();

  const [classId, setClassId] = useState("");

  const { data: exams = [], isLoading: examsLoading } =
    useExamsByClass(classId);

  const { mutate: createExam, isPending: creating } =
    useCreateExam();

  const { mutate: updateExam, isPending: updating } =
    useUpdateExam();

  // ---------------- ADD ----------------

  const [addOpen, setAddOpen] = useState(false);
  const [examName, setExamName] = useState("");
  const [subjects, setSubjects] = useState([{ ...EMPTY }]);
  const [addError, setAddError] = useState("");

  // ---------------- EDIT ----------------

  const [editOpen, setEditOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSubjects, setEditSubjects] = useState([]);
  const [editError, setEditError] = useState("");

  // ---------------- VALIDATION ----------------

  const validate = (list) => {
    if (!list.length) return "At least one subject is required.";

    const names = [];

    for (let i = 0; i < list.length; i++) {
      const name = String(list[i].subject || "").trim();
      const marks = Number(list[i].maxMarks);

      if (!name) return `Subject ${i + 1}: name is required.`;
      if (!list[i].maxMarks)
        return `Subject ${i + 1}: max marks is required.`;
      if (!marks || marks <= 0)
        return `Subject ${i + 1}: enter valid max marks.`;
      if (marks > 1000)
        return `Subject ${i + 1}: max marks cannot exceed 1000.`;

      names.push(name.toLowerCase());
    }

    if (new Set(names).size !== names.length)
      return "Duplicate subjects are not allowed.";

    return "";
  };

  // ---------------- SUBJECT HELPERS ----------------

  const updateSubject = (setter, index, field, value) => {
    setter((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const removeSubject = (setter, list, index, setError) => {
    if (list.length === 1) {
      setError("At least one subject is required.");
      return;
    }

    setter(list.filter((_, i) => i !== index));
  };

  // ---------------- ADD ----------------

  const openAdd = () => {
    setExamName("");
    setSubjects([{ ...EMPTY }]);
    setAddError("");
    setAddOpen(true);
  };

  const closeAdd = () => {
    if (!creating) setAddOpen(false);
  };

  const handleCreate = () => {
    setAddError("");

    if (!classId) return setAddError("Please select a class first.");
    if (!examName.trim()) return setAddError("Exam name is required.");

    const error = validate(subjects);
    if (error) return setAddError(error);

    createExam(
      {
        examName: examName.trim(),
        classId,
        subjects: subjects.map((s) => ({
          subject: s.subject.trim(),
          maxMarks: Number(s.maxMarks),
        })),
      },
      {
        onSuccess: () => {
          setAddOpen(false);
          setExamName("");
          setSubjects([{ ...EMPTY }]);
        },
      }
    );
  };

  // ---------------- EDIT ----------------

  const openEdit = (exam) => {
    setEditingExam(exam);
    setEditName(exam.examName || "");

    setEditSubjects(
      (exam.subjects || []).map((s) => ({
        subject: s.subject || "",
        maxMarks: s.maxMarks ?? "",
      }))
    );

    setEditError("");
    setEditOpen(true);
  };

  const closeEdit = () => {
    if (updating) return;

    setEditOpen(false);
    setEditingExam(null);
    setEditError("");
  };

  const handleUpdate = () => {
    setEditError("");

    if (!editingExam) return;

    if (!editName.trim())
      return setEditError("Exam name is required.");

    const error = validate(editSubjects);
    if (error) return setEditError(error);

    updateExam(
      {
        examId: editingExam._id,
        data: {
          examName: editName.trim(),
          classId:
            editingExam.class?._id ||
            editingExam.class ||
            classId,
          subjects: editSubjects.map((s) => ({
            subject: s.subject.trim(),
            maxMarks: Number(s.maxMarks),
          })),
        },
      },
      {
        onSuccess: closeEdit,
      }
    );
  };

  // ---------------- SUBJECT ROWS ----------------

  const SubjectRows = ({
    list,
    setter,
    errorSetter,
  }) => (
    <Stack spacing={0.75}>
      {list.map((item, index) => (
        <Box
          key={index}
          sx={{
            display: "flex",
            gap: 0.75,
            alignItems: "center",
          }}
        >
          <TextField
            size="small"
            fullWidth
            label="Subject"
            value={item.subject}
            onChange={(e) => {
              updateSubject(
                setter,
                index,
                "subject",
                e.target.value
              );
              errorSetter("");
            }}
          />

          <TextField
            size="small"
            label="Max Marks"
            type="number"
            value={item.maxMarks}
            onChange={(e) => {
              updateSubject(
                setter,
                index,
                "maxMarks",
                e.target.value
              );
              errorSetter("");
            }}
            inputProps={{ min: 1, max: 1000 }}
            sx={{
              width: { xs: 105, sm: 125 },
            }}
          />

          <IconButton
            size="small"
            color="error"
            disabled={list.length === 1}
            onClick={() =>
              removeSubject(
                setter,
                list,
                index,
                errorSetter
              )
            }
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ))}
    </Stack>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: C.page,
        px: { xs: 1, sm: 1.5, md: 2 },
        py: { xs: 1.25, md: 1.75 },
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>

        {/* CLASS FILTER */}

  <Paper
  elevation={0}
  sx={{
    p: 1.25,
    mb: 1.25,
    border: `1px solid ${C.border}`,
    borderRadius: 2,
    bgcolor: "#fff",
  }}
>
  <Stack
    direction={{ xs: "column", sm: "row" }}
    spacing={1}
    alignItems={{ xs: "stretch", sm: "center" }}
    justifyContent="space-between"
  >
    {/* LEFT SIDE */}
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1}
      alignItems={{ xs: "stretch", sm: "center" }}
      sx={{ flex: 1 }}
    >
      {/* LABEL */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        sx={{ minWidth: 120 }}
      >
        <School
          sx={{
            fontSize: 18,
            color: C.primary,
          }}
        />

        <Typography
          fontSize={12}
          fontWeight={800}
        >
          Select Class
        </Typography>
      </Stack>

      {/* CLASS SELECT */}
      <Select
        size="small"
        displayEmpty
        value={classId}
        onChange={(e) => setClassId(e.target.value)}
        disabled={classesLoading}
        fullWidth={mobile}
        sx={{
          minWidth: { sm: 260 },
          height: 38,
          "& .MuiSelect-select": {
            fontSize: 12,
            fontWeight: 600,
          },
        }}
      >
        <MenuItem value="" disabled>
          {classesLoading
            ? "Loading classes..."
            : "Select Class"}
        </MenuItem>

        {classes.map((c) => (
          <MenuItem
            key={c._id}
            value={c._id}
          >
            {c.className} - {c.section}
          </MenuItem>
        ))}
      </Select>

      {/* EXAM COUNT */}
      {classId && (
        <Chip
          size="small"
          label={`${exams.length} exam${
            exams.length === 1 ? "" : "s"
          }`}
          sx={{
            height: 26,
            width: "fit-content",
            bgcolor: C.light,
            color: C.primary,
            fontWeight: 800,
            border: `1px solid ${C.border}`,
          }}
        />
      )}
    </Stack>

    {/* ADD EXAM BUTTON */}
    <Button
      size="small"
      variant="contained"
      startIcon={<Add />}
      onClick={openAdd}
      disabled={!classId}
      sx={{
        ...primaryButton,
        minWidth: { xs: "100%", sm: 110 },
        height: 36,
        flexShrink: 0,
      }}
    >
      {mobile ? "Add Exam" : "Add Exam"}
    </Button>
  </Stack>
</Paper>

      

        {classId ? (
          <Paper
            elevation={0}
            sx={{
              border: `1px solid ${C.border}`,
              borderRadius: 2,
              overflow: "hidden",
              bgcolor: "#fff",
            }}
          >
            {/* TABLE TOOLBAR */}

            <Box
              sx={{
                p: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: `1px solid ${C.border}`,
                bgcolor: "#FCFAFF",
              }}
            >
              <Box>
                <Typography
                  fontSize={13}
                  fontWeight={800}
                  color={C.text}
                >
                  Exam List
                </Typography>

                <Typography
                  fontSize={10.5}
                  color={C.muted}
                >
                  Manage exams for selected class
                </Typography>
              </Box>

            
            </Box>

            {examsLoading ? (
              <Box sx={{ py: 5, textAlign: "center" }}>
                <Typography
                  fontSize={12}
                  color="text.secondary"
                >
                  Loading exams...
                </Typography>
              </Box>
            ) : exams.length === 0 ? (
              <Box
                sx={{
                  py: 6,
                  textAlign: "center",
                }}
              >
                <School
                  sx={{
                    fontSize: 42,
                    color: C.violet,
                    mb: 1,
                  }}
                />

                <Typography
                  fontSize={13}
                  fontWeight={800}
                >
                  No exams found
                </Typography>

                <Typography
                  fontSize={11}
                  color={C.muted}
                >
                  Click "Add Exam" to create an exam.
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ overflowX: "auto" }}>
                <Table
                  size="small"
                  sx={{ minWidth: 650 }}
                >
                  <TableHead>
                    <TableRow sx={{ bgcolor: C.primary }}>
                      <TableCell sx={headCell}>
                        #
                      </TableCell>

                      <TableCell sx={headCell}>
                        Exam Name
                      </TableCell>

                      <TableCell sx={headCell}>
                        Subjects
                      </TableCell>

                      <TableCell
                        sx={{
                          ...headCell,
                          textAlign: "right",
                        }}
                      >
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {exams.map((exam, index) => (
                      <TableRow
                        key={exam._id}
                        hover
                        sx={{
                          "&:hover": {
                            bgcolor: "#FCFAFF",
                          },
                        }}
                      >
                        <TableCell
                          sx={{
                            fontSize: 11,
                            color: C.muted,
                            fontWeight: 700,
                          }}
                        >
                          {index + 1}
                        </TableCell>

                        <TableCell>
                          <Typography
                            fontSize={12.5}
                            fontWeight={800}
                            color={C.text}
                          >
                            {exam.examName}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            flexWrap="wrap"
                            useFlexGap
                          >
                            {exam.subjects?.map(
                              (s, i) => (
                                <Chip
                                  key={`${s.subject}-${i}`}
                                  size="small"
                                  label={`${s.subject} · ${s.maxMarks}`}
                                  sx={{
                                    height: 24,
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    bgcolor: C.light,
                                    color: C.primary,
                                    border: `1px solid ${C.border}`,
                                  }}
                                />
                              )
                            )}
                          </Stack>
                        </TableCell>

                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Edit />}
                            onClick={() =>
                              openEdit(exam)
                            }
                            sx={{
                              textTransform: "none",
                              fontSize: 11.5,
                              fontWeight: 800,
                              color: C.primary,
                              borderColor: "#C4B5FD",
                              "&:hover": {
                                bgcolor: C.light,
                                borderColor: C.primary,
                              },
                            }}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        ) : (
          <Paper
            elevation={0}
            sx={{
              py: 6,
              textAlign: "center",
              border: `1px solid ${C.border}`,
              borderRadius: 2,
            }}
          >
            <School
              sx={{
                fontSize: 42,
                color: C.violet,
              }}
            />

            <Typography
              fontSize={14}
              fontWeight={800}
            >
              Select a class
            </Typography>

            <Typography
              fontSize={11.5}
              color={C.muted}
            >
              Select a class above to view exams.
            </Typography>
          </Paper>
        )}

        {/* ================= ADD DIALOG ================= */}

        <Dialog
          open={addOpen}
          onClose={closeAdd}
          fullWidth
          maxWidth="sm"
          fullScreen={mobile}
          sx={{ zIndex: 1500 }}
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, sm: 2 },
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle
            sx={{
              bgcolor: C.primary,
              color: "#fff",
              py: 1.25,
              px: 1.5,
              fontSize: 15,
              fontWeight: 800,
            }}
          >
            Add New Exam

            <IconButton
              onClick={closeAdd}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                color: "#fff",
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          </DialogTitle>

          <DialogContent
            sx={{
              bgcolor: "#FCFAFF",
              p: { xs: 1.5, sm: 2 },
            }}
          >
            {addError && (
              <Alert
                severity="error"
                sx={{
                  mb: 1.25,
                  py: 0,
                  fontSize: 11,
                }}
              >
                {addError}
              </Alert>
            )}

            <TextField
              fullWidth
              size="small"
              label="Exam Name"
              placeholder="e.g. Half Yearly Examination"
              value={examName}
              onChange={(e) => {
                setExamName(e.target.value);
                setAddError("");
              }}
              sx={{ mb: 1.5 }}
            />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 0.75,
              }}
            >
              <Typography
                fontSize={12}
                fontWeight={800}
              >
                Subjects
              </Typography>

              <Button
                size="small"
                startIcon={<Add />}
                onClick={() =>
                  setSubjects((p) => [
                    ...p,
                    { ...EMPTY },
                  ])
                }
                sx={linkButton}
              >
                Add Subject
              </Button>
            </Box>

            <SubjectRows
              list={subjects}
              setter={setSubjects}
              errorSetter={setAddError}
            />
          </DialogContent>

          <DialogActions sx={dialogActions}>
            <Button
              onClick={closeAdd}
              disabled={creating}
              sx={cancelButton}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleCreate}
              disabled={creating}
              sx={primaryButton}
            >
              {creating ? "Creating..." : "Create Exam"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ================= EDIT DIALOG ================= */}

        <Dialog
          open={editOpen}
          onClose={closeEdit}
          fullWidth
          maxWidth="sm"
          fullScreen={mobile}
          sx={{
            zIndex: 1600,
            "& .MuiDialog-container": {
              zIndex: 1600,
            },
          }}
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, sm: 2 },
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle
            sx={{
              bgcolor: C.primary,
              color: "#fff",
              py: 1.25,
              px: 1.5,
              fontSize: 15,
              fontWeight: 800,
            }}
          >
            Edit Exam

            <IconButton
              onClick={closeEdit}
              disabled={updating}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                color: "#fff",
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          </DialogTitle>

          <DialogContent
            sx={{
              bgcolor: "#FCFAFF",
              p: { xs: 1.5, sm: 2 },
            }}
          >
            {editError && (
              <Alert
                severity="error"
                sx={{
                  mb: 1.25,
                  py: 0,
                  fontSize: 11,
                }}
              >
                {editError}
              </Alert>
            )}

            <TextField
              fullWidth
              size="small"
              label="Exam Name"
              value={editName}
              onChange={(e) => {
                setEditName(e.target.value);
                setEditError("");
              }}
              sx={{ mb: 1.5 }}
            />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 0.75,
              }}
            >
              <Typography
                fontSize={12}
                fontWeight={800}
              >
                Subjects
              </Typography>

              <Button
                size="small"
                startIcon={<Add />}
                onClick={() =>
                  setEditSubjects((p) => [
                    ...p,
                    { ...EMPTY },
                  ])
                }
                sx={linkButton}
              >
                Add Subject
              </Button>
            </Box>

            <SubjectRows
              list={editSubjects}
              setter={setEditSubjects}
              errorSetter={setEditError}
            />
          </DialogContent>

          <DialogActions sx={dialogActions}>
            <Button
              onClick={closeEdit}
              disabled={updating}
              sx={cancelButton}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleUpdate}
              disabled={updating}
              sx={primaryButton}
            >
              {updating ? "Updating..." : "Update Exam"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}

// ================= STYLES =================

const headCell = {
  color: "#fff",
  fontSize: 11.5,
  fontWeight: 800,
  whiteSpace: "nowrap",
  py: 0.9,
};

const primaryButton = {
  textTransform: "none",
  fontWeight: 800,
  fontSize: 11.5,
  bgcolor: "#6D28D9",
  boxShadow: "none",
  "&:hover": {
    bgcolor: "#4C1D95",
    boxShadow: "none",
  },
  "&.Mui-disabled": {
    bgcolor: "#E5E7EB",
    color: "#9CA3AF",
  },
};

const linkButton = {
  textTransform: "none",
  fontSize: 11,
  fontWeight: 800,
  color: "#6D28D9",
  "&:hover": {
    bgcolor: "#F5F3FF",
  },
};

const cancelButton = {
  textTransform: "none",
  fontWeight: 700,
  color: "#6B7280",
};

const dialogActions = {
  p: 1,
  borderTop: "1px solid #E9D5FF",
};