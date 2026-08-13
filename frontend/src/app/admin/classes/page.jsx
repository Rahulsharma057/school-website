"use client";

import { useState } from "react";

import {
  Box,
  Button,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Typography,
  Chip,
  Avatar,
  Stack,
  Tooltip,
} from "@mui/material";

import { Edit, Delete, School, PersonOutline, Add } from "@mui/icons-material";

import {
  useClasses,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
} from "@/hooks/useClasses";

export default function ClassesPage() {
  const { data: classes = [], isLoading } = useClasses();

  const { mutate: createClass, isPending: isCreating } = useCreateClass();

  const { mutate: updateClass, isPending: isUpdating } = useUpdateClass();

  const { mutate: deleteClass, isPending: isDeleting } = useDeleteClass();

  const [form, setForm] = useState({
    className: "",
    section: "",
  });

  const [editDialog, setEditDialog] = useState(null);

  // =========================
  // CREATE
  // =========================

  const handleCreate = () => {
    const className = form.className.trim();
    const section = form.section.trim();

    if (!className || !section) {
      return;
    }

    createClass(
      {
        className,
        section,
      },
      {
        onSuccess: () => {
          setForm({
            className: "",
            section: "",
          });
        },
      },
    );
  };

  // =========================
  // EDIT
  // =========================

  const handleEdit = (classItem) => {
    if (!classItem?._id) {
      return;
    }

    setEditDialog({
      ...classItem,
    });
  };

  // =========================
  // UPDATE
  // =========================

  const handleUpdate = () => {
    if (!editDialog?._id) {
      return;
    }

    const className = editDialog.className?.trim();
    const section = editDialog.section?.trim();

    if (!className || !section) {
      return;
    }

    updateClass(
      {
        id: editDialog._id,
        data: {
          className,
          section,
        },
      },
      {
        onSuccess: () => {
          setEditDialog(null);
        },
      },
    );
  };

  // =========================
  // DELETE
  // =========================

  const handleDelete = (id) => {
    if (!id) {
      return;
    }

    if (window.confirm("Are you sure you want to delete this class?")) {
      deleteClass(id);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* =========================
          PAGE TITLE
      ========================= */}

      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Avatar sx={{ bgcolor: "#eff6ff", color: "#2563eb", width: 44, height: 44 }}>
          <School />
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>
            Classes
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Manage school classes and sections
          </Typography>
        </Box>
      </Stack>

      {/* =========================
          CREATE CLASS
      ========================= */}

      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: "1px solid #e2e8f0",
          borderRadius: 3,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#334155", mb: 2 }}>
          Add New Class
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <TextField
            label="Class Name (e.g. 10)"
            size="small"
            value={form.className}
            onChange={(e) =>
              setForm({
                ...form,
                className: e.target.value,
              })
            }
            sx={{ minWidth: 200 }}
          />

          <TextField
            label="Section (e.g. A)"
            size="small"
            value={form.section}
            onChange={(e) =>
              setForm({
                ...form,
                section: e.target.value,
              })
            }
            sx={{ minWidth: 160 }}
          />

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreate}
            disabled={isCreating}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              boxShadow: "none",
              "&:hover": { boxShadow: "none" },
            }}
          >
            {isCreating ? "Adding..." : "Add Class"}
          </Button>
        </Stack>
      </Paper>

      {/* =========================
          CLASSES TABLE
      ========================= */}

      <Paper
        elevation={0}
        sx={{
          border: "1px solid #e2e8f0",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f8fafc" }}>
              <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "0.8rem" }}>
                CLASS
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "0.8rem" }}>
                SECTION
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "0.8rem" }}>
                CLASS TEACHER
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: "#475569", fontSize: "0.8rem" }}>
                ACTIONS
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                  <Stack alignItems="center" spacing={1}>
                    <School sx={{ fontSize: 40, color: "#cbd5e1" }} />
                    <Typography sx={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                      No classes yet — add your first class above
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              classes.map((c) => (
                <TableRow
                  key={c?._id}
                  sx={{
                    "&:hover": { backgroundColor: "#f8fafc" },
                    "&:last-child td": { borderBottom: 0 },
                  }}
                >
                  <TableCell>
                    <Chip
                      label={`Class ${c?.className || "—"}`}
                      size="small"
                      sx={{
                        backgroundColor: "#eff6ff",
                        color: "#2563eb",
                        fontWeight: 600,
                        borderRadius: 1.5,
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <Typography sx={{ fontWeight: 500, color: "#334155" }}>
                      {c?.section || "—"}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {c?.classTeacher?.name ? (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar sx={{ width: 26, height: 26, bgcolor: "#f1f5f9", color: "#64748b" }}>
                          <PersonOutline sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography variant="body2" sx={{ color: "#334155" }}>
                          {c.classTeacher.name}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" sx={{ color: "#cbd5e1" }}>
                        Not assigned
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title="Edit class">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(c)}
                          disabled={!c?._id}
                          sx={{ color: "#64748b", "&:hover": { color: "#2563eb", backgroundColor: "#eff6ff" } }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip title="Delete class">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(c?._id)}
                          disabled={!c?._id || isDeleting}
                          sx={{ color: "#64748b", "&:hover": { color: "#dc2626", backgroundColor: "#fef2f2" } }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* =========================
          EDIT DIALOG
      ========================= */}

      <Dialog
        open={Boolean(editDialog)}
        onClose={() => setEditDialog(null)}
        PaperProps={{ sx: { borderRadius: 3, minWidth: 360 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#1e293b" }}>Edit Class</DialogTitle>

        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            pt: 1,
          }}
        >
          <TextField
            label="Class Name"
            size="small"
            value={editDialog?.className ?? ""}
            onChange={(e) =>
              setEditDialog((prev) =>
                prev
                  ? {
                      ...prev,
                      className: e.target.value,
                    }
                  : null,
              )
            }
          />

          <TextField
            label="Section"
            size="small"
            value={editDialog?.section ?? ""}
            onChange={(e) =>
              setEditDialog((prev) =>
                prev
                  ? {
                      ...prev,
                      section: e.target.value,
                    }
                  : null,
              )
            }
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditDialog(null)} sx={{ textTransform: "none", color: "#64748b" }}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleUpdate}
            disabled={!editDialog?._id || isUpdating}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, boxShadow: "none" }}
          >
            {isUpdating ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}