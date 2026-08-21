"use client";

import { useState } from "react";

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
  IconButton,
  InputAdornment,
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

import { Add, Close, DeleteOutline, EditOutlined, School, Search } from "@mui/icons-material";

import { usePrograms, useCreateProgram, useUpdateProgram, useDeleteProgram } from "@/hooks/useProgram";

const PURPLE = "#7c3aed";

export default function ProgramsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [search, setSearch] = useState("");

  const { data: programs = [], isLoading } = usePrograms();

  const { mutate: createProgram, isPending: isCreating } = useCreateProgram();
  const { mutate: updateProgram, isPending: isUpdating } = useUpdateProgram();
  const { mutate: deleteProgram, isPending: isDeleting } = useDeleteProgram();

  const emptyForm = { name: "", code: "", durationYears: "", totalSemesters: "" };
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);

  const isSaving = isCreating || isUpdating;

  const filteredPrograms = programs.filter((p) => {
    const searchValue = search.trim().toLowerCase();
    if (!searchValue) return true;
    return p.name?.toLowerCase().includes(searchValue) || p.code?.toLowerCase().includes(searchValue);
  });

  const openCreate = () => {
    setEditingProgram(null);
    setForm(emptyForm);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (program) => {
    setEditingProgram(program);
    setForm({
      name: program.name || "",
      code: program.code || "",
      durationYears: program.durationYears ?? "",
      totalSemesters: program.totalSemesters ?? "",
    });
    setErrors({});
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (isSaving) return;
    setDialogOpen(false);
    setEditingProgram(null);
    setForm(emptyForm);
    setErrors({});
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // duration change hone par totalSemesters auto-suggest karo (2 * years)
      if (field === "durationYears" && value) {
        next.totalSemesters = String(Number(value) * 2);
      }
      return next;
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Program name is required";
    if (!form.durationYears || Number(form.durationYears) < 1) newErrors.durationYears = "Valid duration is required";
    if (!form.totalSemesters || Number(form.totalSemesters) < 1) newErrors.totalSemesters = "Valid total semesters is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      durationYears: Number(form.durationYears),
      totalSemesters: Number(form.totalSemesters),
    };

    if (editingProgram) {
      updateProgram({ id: editingProgram._id, data: payload }, { onSuccess: closeDialog });
      return;
    }

    createProgram(payload, { onSuccess: closeDialog });
  };

  const handleDelete = (program) => {
    const confirmed = window.confirm(`Delete program "${program.name}"?`);
    if (!confirmed) return;
    deleteProgram(program._id);
  };

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
                <School />
              </Avatar>
              <Box>
                <Typography variant={isMobile ? "h6" : "h5"} fontWeight={800} color="#172033">
                  Programs
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  College courses (B.Tech, BCA, B.Com) and their semester structure.
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
              Add Program
            </Button>
          </Stack>
        </Box>
      </Card>

      {/* TABLE CARD */}
      <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 2.5, bgcolor: "#fff", overflow: "hidden" }}>
        <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Typography variant="h6" fontWeight={750} sx={{ fontSize: { xs: 16, sm: 18 } }}>
            All Programs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredPrograms.length} program{filteredPrograms.length !== 1 ? "s" : ""} found
          </Typography>
        </Box>

        <Divider />

        <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: "#fafafa" }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search programs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 400 }}
          />
        </Box>

        <Divider />

        {isLoading ? (
          <Box sx={{ minHeight: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress sx={{ color: PURPLE }} />
          </Box>
        ) : filteredPrograms.length === 0 ? (
          <Box sx={{ py: 8, px: 2, textAlign: "center" }}>
            <Avatar sx={{ width: 58, height: 58, mx: "auto", mb: 1.5, bgcolor: "#f3e8ff", color: PURPLE }}>
              <School />
            </Avatar>
            <Typography fontWeight={750}>No programs found</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Add your first program to schedule college exams.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={openCreate}
              sx={{ mt: 2, textTransform: "none", borderColor: PURPLE, color: PURPLE }}
            >
              Add Program
            </Button>
          </Box>
        ) : isMobile ? (
          <Box sx={{ p: 1.5 }}>
            <Stack spacing={1.5}>
              {filteredPrograms.map((program) => (
                <Box key={program._id} sx={{ border: "1px solid #e5e7eb", borderRadius: 2, p: 1.75 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: "#ede9fe", color: PURPLE, fontWeight: 700 }}>
                        {program.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box minWidth={0}>
                        <Typography variant="body2" fontWeight={750} noWrap>
                          {program.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {program.code || "No code"}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small" onClick={() => openEdit(program)} sx={{ color: PURPLE, bgcolor: "#faf5ff" }}>
                        <EditOutlined fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={isDeleting}
                        onClick={() => handleDelete(program)}
                        sx={{ bgcolor: "#fef2f2" }}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>

                  <Divider sx={{ my: 1.25 }} />

                  <Stack direction="row" spacing={1}>
                    <Chip size="small" label={`${program.durationYears} years`} sx={{ bgcolor: "#f3e8ff", color: PURPLE, fontWeight: 700 }} />
                    <Chip size="small" label={`${program.totalSemesters} semesters`} variant="outlined" />
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
                  <TableCell sx={{ fontWeight: 750, color: "#475569" }}>Program</TableCell>
                  <TableCell sx={{ fontWeight: 750, color: "#475569" }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 750, color: "#475569" }}>Duration</TableCell>
                  <TableCell sx={{ fontWeight: 750, color: "#475569" }}>Semesters</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 750, color: "#475569" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredPrograms.map((program) => (
                  <TableRow key={program._id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Avatar sx={{ width: 34, height: 34, bgcolor: "#ede9fe", color: PURPLE, fontSize: 13, fontWeight: 700 }}>
                          {program.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight={700}>
                          {program.name}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color={program.code ? "text.primary" : "text.secondary"}>
                        {program.code || "—"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{program.durationYears} years</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{program.totalSemesters} semesters</Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Edit Program">
                          <IconButton
                            size="small"
                            onClick={() => openEdit(program)}
                            sx={{ color: PURPLE, border: "1px solid #ddd6fe", bgcolor: "#fff", "&:hover": { bgcolor: "#faf5ff" } }}
                          >
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Program">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              disabled={isDeleting}
                              onClick={() => handleDelete(program)}
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
                <Avatar sx={{ width: 40, height: 40, bgcolor: PURPLE }}>{editingProgram ? <EditOutlined /> : <School />}</Avatar>
                <Box>
                  <Typography fontWeight={800} fontSize={17}>
                    {editingProgram ? "Edit Program" : "Add Program"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {editingProgram ? "Update program details" : "Create a new college program"}
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
              label="Program Name"
              placeholder="e.g. B.Tech Computer Science"
              value={form.name}
              onChange={handleChange("name")}
              error={Boolean(errors.name)}
              helperText={errors.name}
            />

            <TextField
              fullWidth
              size="small"
              label="Program Code"
              placeholder="e.g. BTECH-CSE"
              value={form.code}
              onChange={(e) => handleChange("code")({ target: { value: e.target.value.toUpperCase() } })}
            />

            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Duration (Years)"
                value={form.durationYears}
                onChange={handleChange("durationYears")}
                error={Boolean(errors.durationYears)}
                helperText={errors.durationYears}
                inputProps={{ min: 1, max: 6 }}
              />

              <TextField
                fullWidth
                size="small"
                type="number"
                label="Total Semesters"
                value={form.totalSemesters}
                onChange={handleChange("totalSemesters")}
                error={Boolean(errors.totalSemesters)}
                helperText={errors.totalSemesters || "Auto-suggested from duration"}
                inputProps={{ min: 1 }}
              />
            </Stack>
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
            {isSaving ? "Saving..." : editingProgram ? "Update Program" : "Add Program"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}