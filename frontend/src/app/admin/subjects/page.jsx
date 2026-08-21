"use client";

import { useMemo, useState } from "react";

import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
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
  Close,
  DeleteOutline,
  EditOutlined,
  MenuBookOutlined,
  Science,
  Search,
} from "@mui/icons-material";

import {
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
} from "@/hooks/useSubject";

const PURPLE = "#7c3aed";

const LEVEL_OPTIONS = [
  { value: "BOTH", label: "Both (School & College)" },
  { value: "SCHOOL", label: "School" },
  { value: "COLLEGE", label: "College" },
];

export default function SubjectsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  const { data: subjects = [], isLoading } = useSubjects({
    ...(levelFilter ? { level: levelFilter } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
  });

  const { mutate: createSubject, isPending: isCreating } = useCreateSubject();
  const { mutate: updateSubject, isPending: isUpdating } = useUpdateSubject();
  const { mutate: deleteSubject, isPending: isDeleting } = useDeleteSubject();

  const emptyForm = { name: "", code: "", level: "BOTH", hasPractical: false };
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const isSaving = isCreating || isUpdating;

  const openCreate = () => {
    setEditingSubject(null);
    setForm(emptyForm);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (subject) => {
    setEditingSubject(subject);
    setForm({
      name: subject.name || "",
      code: subject.code || "",
      level: subject.level || "BOTH",
      hasPractical: Boolean(subject.hasPractical),
    });
    setErrors({});
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (isSaving) return;
    setDialogOpen(false);
    setEditingSubject(null);
    setForm(emptyForm);
    setErrors({});
  };

  const handleChange = (field) => (e) => {
    const value = field === "hasPractical" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Subject name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      level: form.level,
      hasPractical: form.hasPractical,
    };

    if (editingSubject) {
      updateSubject({ id: editingSubject._id, data: payload }, { onSuccess: closeDialog });
      return;
    }

    createSubject(payload, { onSuccess: closeDialog });
  };

  const handleDelete = (subject) => {
    const confirmed = window.confirm(`Delete subject "${subject.name}"?`);
    if (!confirmed) return;
    deleteSubject(subject._id);
  };

  const filteredCount = subjects.length;

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
              <Avatar sx={{ width: 46, height: 46, bgcolor: PURPLE }}>
                <MenuBookOutlined />
              </Avatar>
              <Box>
                <Typography variant={isMobile ? "h6" : "h5"} fontWeight={800} color="#172033">
                  Subjects
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Master subject list used across exams and results.
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openCreate}
              sx={{
                minHeight: 42,
                px: 2.2,
                borderRadius: 1.8,
                bgcolor: PURPLE,
                textTransform: "none",
                fontWeight: 700,
                boxShadow: "none",
                "&:hover": { bgcolor: "#6d28d9", boxShadow: "none" },
              }}
            >
              Add Subject
            </Button>
          </Stack>
        </Box>
      </Card>

      {/* TABLE CARD */}
      <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 2.5, bgcolor: "#fff", overflow: "hidden" }}>
        <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Typography variant="h6" fontWeight={750} sx={{ fontSize: { xs: 16, sm: 18 } }}>
            All Subjects
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredCount} subject{filteredCount !== 1 ? "s" : ""} found
          </Typography>
        </Box>

        <Divider />

        {/* FILTERS */}
        <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: "#fafafa" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" }, gap: 1.5 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search subjects..."
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

            <TextField
              select
              size="small"
              fullWidth
              label="Level"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <MenuItem value="">All Levels</MenuItem>
              {LEVEL_OPTIONS.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>

        <Divider />

        {isLoading ? (
          <Box sx={{ minHeight: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress sx={{ color: PURPLE }} />
          </Box>
        ) : subjects.length === 0 ? (
          <Box sx={{ py: 8, px: 2, textAlign: "center" }}>
            <Avatar sx={{ width: 58, height: 58, mx: "auto", mb: 1.5, bgcolor: "#f3e8ff", color: PURPLE }}>
              <MenuBookOutlined />
            </Avatar>
            <Typography fontWeight={750}>No subjects found</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Add your first subject to use it in exams.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={openCreate}
              sx={{ mt: 2, textTransform: "none", borderColor: PURPLE, color: PURPLE }}
            >
              Add Subject
            </Button>
          </Box>
        ) : isMobile ? (
          <Box sx={{ p: 1.5 }}>
            <Stack spacing={1.5}>
              {subjects.map((subject) => (
                <Box key={subject._id} sx={{ border: "1px solid #e5e7eb", borderRadius: 2, p: 1.75 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: "#ede9fe", color: PURPLE, fontWeight: 700 }}>
                        {subject.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box minWidth={0}>
                        <Typography variant="body2" fontWeight={750} noWrap>
                          {subject.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {subject.code || "No code"}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small" onClick={() => openEdit(subject)} sx={{ color: PURPLE, bgcolor: "#faf5ff" }}>
                        <EditOutlined fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={isDeleting}
                        onClick={() => handleDelete(subject)}
                        sx={{ bgcolor: "#fef2f2" }}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>

                  <Divider sx={{ my: 1.25 }} />

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip size="small" label={subject.level} sx={{ bgcolor: "#f3e8ff", color: PURPLE, fontWeight: 700 }} />
                    {subject.hasPractical && (
                      <Chip size="small" icon={<Science sx={{ fontSize: 14 }} />} label="Has Practical" variant="outlined" />
                    )}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        ) : (
          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <Table sx={{ minWidth: 640 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#fafafa" }}>
                  <TableCell sx={{ fontWeight: 750, color: "#475569" }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 750, color: "#475569" }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 750, color: "#475569" }}>Level</TableCell>
                  <TableCell sx={{ fontWeight: 750, color: "#475569" }}>Practical</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 750, color: "#475569" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {subjects.map((subject) => (
                  <TableRow key={subject._id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Avatar sx={{ width: 34, height: 34, bgcolor: "#ede9fe", color: PURPLE, fontSize: 13, fontWeight: 700 }}>
                          {subject.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight={700}>
                          {subject.name}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color={subject.code ? "text.primary" : "text.secondary"}>
                        {subject.code || "—"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip size="small" label={subject.level} sx={{ bgcolor: "#f3e8ff", color: PURPLE, fontWeight: 700 }} />
                    </TableCell>

                    <TableCell>
                      {subject.hasPractical ? (
                        <Chip size="small" icon={<Science sx={{ fontSize: 14 }} />} label="Yes" color="success" variant="outlined" />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Edit Subject">
                          <IconButton
                            size="small"
                            onClick={() => openEdit(subject)}
                            sx={{ color: PURPLE, border: "1px solid #ddd6fe", bgcolor: "#fff", "&:hover": { bgcolor: "#faf5ff" } }}
                          >
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Subject">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              disabled={isDeleting}
                              onClick={() => handleDelete(subject)}
                              sx={{ border: "1px solid #fecaca", bgcolor: "#fff", "&:hover": { bgcolor: "#fef2f2" } }}
                            >
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      {/* CREATE / EDIT DIALOG */}
      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, overflow: "hidden" } }}
      >
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ px: 2.5, py: 2, bgcolor: "#faf5ff", borderBottom: "1px solid #ede9fe" }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Avatar sx={{ width: 40, height: 40, bgcolor: PURPLE }}>
                  {editingSubject ? <EditOutlined /> : <MenuBookOutlined />}
                </Avatar>
                <Box>
                  <Typography fontWeight={800} fontSize={17}>
                    {editingSubject ? "Edit Subject" : "Add Subject"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {editingSubject ? "Update subject details" : "Create a new master subject"}
                  </Typography>
                </Box>
              </Stack>
              <IconButton onClick={closeDialog} disabled={isSaving}>
                <Close />
              </IconButton>
            </Stack>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack spacing={2.2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Subject Name"
              placeholder="e.g. Mathematics"
              value={form.name}
              onChange={handleChange("name")}
              error={Boolean(errors.name)}
              helperText={errors.name}
            />

            <TextField
              fullWidth
              size="small"
              label="Subject Code"
              placeholder="e.g. MATH101"
              value={form.code}
              onChange={(e) => handleChange("code")({ target: { value: e.target.value.toUpperCase() } })}
            />

            <TextField
              select
              fullWidth
              size="small"
              label="Applicable Level"
              value={form.level}
              onChange={handleChange("level")}
            >
              {LEVEL_OPTIONS.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 2, p: 1.5, bgcolor: form.hasPractical ? "#faf5ff" : "#fff" }}>
              <FormControlLabel
                control={
                  <Switch checked={form.hasPractical} onChange={handleChange("hasPractical")} sx={{ "& .Mui-checked": { color: PURPLE } }} />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={700}>
                      Has Practical Component
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Enable if this subject typically has a practical/lab exam.
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, sm: 2.5 }, py: 1.75, borderTop: "1px solid #e5e7eb" }}>
          <Button onClick={closeDialog} disabled={isSaving} sx={{ textTransform: "none", color: "#475569" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={17} color="inherit" /> : <Add />}
            sx={{
              minWidth: 150,
              minHeight: 40,
              bgcolor: PURPLE,
              textTransform: "none",
              fontWeight: 700,
              boxShadow: "none",
              "&:hover": { bgcolor: "#6d28d9", boxShadow: "none" },
            }}
          >
            {isSaving ? "Saving..." : editingSubject ? "Update Subject" : "Add Subject"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}