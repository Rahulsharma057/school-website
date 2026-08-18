"use client";

import { useEffect, useMemo, useState } from "react";

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
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  Add,
  CheckCircleOutline,
  ClassOutlined,
  Close,
  Delete,
  Edit,
  Groups,
  PersonOutline,
  Refresh,
  School,
  Search,
  WarningAmberOutlined,
} from "@mui/icons-material";

import {
  useClasses,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
} from "@/hooks/useClasses";

/* =========================================================
   CONSTANTS
========================================================= */

const EMPTY_FORM = {
  className: "",
  section: "",
};

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

/* =========================================================
   HELPERS
========================================================= */

const normalize = (value = "") =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getInitials = (name = "") =>
  String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join("") || "?";

const avatarColors = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#ea580c",
  "#dc2626",
  "#0891b2",
];

const getAvatarColor = (name = "") => {
  const code = name.charCodeAt(0) || 0;
  return avatarColors[code % avatarColors.length];
};

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
  background,
}) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: "1px solid #e2e8f0",
        borderRadius: { xs: 2, sm: 2.25 },
        background: "#fff",
        transition: "all .2s ease",

        "&:hover": {
          borderColor: "#cbd5e1",
          boxShadow: "0 8px 24px rgba(15,23,42,.06)",
        },
      }}
    >
      <CardContent
        sx={{
          p: {
            xs: 1.25,
            sm: 1.5,
            md: 1.75,
          },

          "&:last-child": {
            pb: {
              xs: 1.25,
              sm: 1.5,
              md: 1.75,
            },
          },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={1}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: {
                  xs: 9,
                  sm: 10,
                },
                fontWeight: 800,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: ".04em",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                fontSize: {
                  xs: 20,
                  sm: 23,
                },
                lineHeight: 1,
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              {value}
            </Typography>

            <Typography
              sx={{
                mt: 0.4,
                fontSize: {
                  xs: 9,
                  sm: 10,
                },
                color: "#94a3b8",
                whiteSpace: "nowrap",
              }}
            >
              {subtitle}
            </Typography>
          </Box>

          <Box
            sx={{
              width: {
                xs: 34,
                sm: 38,
              },
              height: {
                xs: 34,
                sm: 38,
              },
              flexShrink: 0,
              borderRadius: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: background,
              color,
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   LOADING DESKTOP
========================================================= */

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 7 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton width={120} />
          </TableCell>

          <TableCell>
            <Skeleton width={35} height={24} />
          </TableCell>

          <TableCell>
            <Stack direction="row" spacing={1} alignItems="center">
              <Skeleton
                variant="circular"
                width={32}
                height={32}
              />

              <Box>
                <Skeleton width={110} />
                <Skeleton width={70} />
              </Box>
            </Stack>
          </TableCell>

          <TableCell>
            <Skeleton width={90} height={24} />
          </TableCell>

          <TableCell align="right">
            <Stack
              direction="row"
              justifyContent="flex-end"
              spacing={0.5}
            >
              <Skeleton
                variant="circular"
                width={32}
                height={32}
              />

              <Skeleton
                variant="circular"
                width={32}
                height={32}
              />
            </Stack>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

/* =========================================================
   MOBILE LOADING
========================================================= */

function MobileLoadingCards() {
  return (
    <Stack spacing={1}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Card
          key={index}
          elevation={0}
          sx={{
            border: "1px solid #e2e8f0",
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: 1.5 }}>
            <Stack direction="row" spacing={1.25}>
              <Skeleton
                variant="rounded"
                width={40}
                height={40}
              />

              <Box sx={{ flex: 1 }}>
                <Skeleton width="55%" />
                <Skeleton width="75%" />
              </Box>

              <Skeleton
                variant="rounded"
                width={65}
                height={24}
              />
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  search,
  hasFilters,
  onClear,
  onAdd,
}) {
  const filtered = Boolean(search || hasFilters);

  return (
    <Box
      sx={{
        py: {
          xs: 6,
          sm: 8,
        },
        px: 2,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          mx: "auto",
          mb: 1.5,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: filtered ? "#f8fafc" : "#eff6ff",
          color: filtered ? "#94a3b8" : "#2563eb",
        }}
      >
        {filtered ? <Search /> : <School />}
      </Box>

      <Typography
        sx={{
          fontSize: 14,
          fontWeight: 800,
          color: "#334155",
        }}
      >
        {filtered
          ? "No matching classes"
          : "No classes found"}
      </Typography>

      <Typography
        sx={{
          mt: 0.5,
          fontSize: 11.5,
          color: "#94a3b8",
        }}
      >
        {filtered
          ? "Try changing your search or teacher filter."
          : "Create your first class to start managing sections."}
      </Typography>

      <Button
        size="small"
        variant={filtered ? "text" : "contained"}
        startIcon={
          filtered ? (
            <Close fontSize="small" />
          ) : (
            <Add fontSize="small" />
          )
        }
        onClick={filtered ? onClear : onAdd}
        sx={{
          mt: 1.5,
          minHeight: 38,
          px: 1.75,
          textTransform: "none",
          fontWeight: 700,
          borderRadius: 1.5,
          boxShadow: "none",
        }}
      >
        {filtered ? "Clear Filters" : "Add First Class"}
      </Button>
    </Box>
  );
}

/* =========================================================
   MOBILE CLASS CARD
========================================================= */

function MobileClassCard({
  item,
  onEdit,
  onDelete,
}) {
  const teacherName =
    item?.classTeacher?.name || "";

  const hasTeacher = Boolean(teacherName);

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid #e2e8f0",
        borderRadius: 2,
        background: "#fff",
        overflow: "hidden",
        transition: "all .2s ease",

        "&:active": {
          transform: "scale(.995)",
        },
      }}
    >
      <CardContent
        sx={{
          p: 1.5,
          "&:last-child": {
            pb: 1.5,
          },
        }}
      >
        {/* TOP */}

        <Stack
          direction="row"
          alignItems="flex-start"
          spacing={1.25}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              flexShrink: 0,
              borderRadius: 1.5,
              bgcolor: "#eff6ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <School sx={{ fontSize: 21 }} />
          </Box>

          <Box
            sx={{
              minWidth: 0,
              flex: 1,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
              flexWrap="wrap"
            >
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                Class {item?.className || "—"}
              </Typography>

              <Chip
                label={`Section ${item?.section || "—"}`}
                size="small"
                sx={{
                  height: 21,
                  borderRadius: 1,
                  bgcolor: "#f1f5f9",
                  color: "#475569",
                  fontSize: 9.5,
                  fontWeight: 800,
                }}
              />
            </Stack>

            <Typography
              sx={{
                mt: 0.35,
                fontSize: 10,
                color: "#94a3b8",
              }}
            >
              Class section
            </Typography>
          </Box>

          {/* STATUS */}

          {hasTeacher ? (
            <Chip
              icon={
                <CheckCircleOutline
                  sx={{
                    fontSize:
                      "13px !important",
                  }}
                />
              }
              label="Ready"
              size="small"
              color="success"
              sx={{
                flexShrink: 0,
                height: 23,
                borderRadius: 1,
                fontSize: 9,
                fontWeight: 800,
              }}
            />
          ) : (
            <Chip
              icon={
                <WarningAmberOutlined
                  sx={{
                    fontSize:
                      "13px !important",
                  }}
                />
              }
              label="Needs Teacher"
              size="small"
              color="warning"
              variant="outlined"
              sx={{
                flexShrink: 0,
                height: 23,
                borderRadius: 1,
                fontSize: 8.5,
                fontWeight: 800,
                maxWidth: 105,
              }}
            />
          )}
        </Stack>

        <Divider sx={{ my: 1.25 }} />

        {/* TEACHER */}

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={1}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              minWidth: 0,
              flex: 1,
            }}
          >
            <Avatar
              sx={{
                width: 34,
                height: 34,
                flexShrink: 0,
                fontSize: 10,
                fontWeight: 800,
                bgcolor: hasTeacher
                  ? getAvatarColor(teacherName)
                  : "#f8fafc",
                color: hasTeacher
                  ? "#fff"
                  : "#94a3b8",
              }}
            >
              {hasTeacher ? (
                getInitials(teacherName)
              ) : (
                <PersonOutline
                  sx={{ fontSize: 17 }}
                />
              )}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                noWrap
                sx={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: hasTeacher
                    ? "#334155"
                    : "#94a3b8",
                }}
              >
                {hasTeacher
                  ? teacherName
                  : "Not assigned"}
              </Typography>

              <Typography
                sx={{
                  fontSize: 9,
                  color: "#94a3b8",
                }}
              >
                {hasTeacher
                  ? "Class Teacher"
                  : "Teacher required"}
              </Typography>
            </Box>
          </Stack>

          {/* ACTIONS */}

          <Stack
            direction="row"
            spacing={0.5}
            flexShrink={0}
          >
            <IconButton
              onClick={() => onEdit(item)}
              sx={{
                width: 38,
                height: 38,
                borderRadius: 1.25,
                border: "1px solid #e2e8f0",
                color: "#64748b",

                "&:hover": {
                  bgcolor: "#eff6ff",
                  color: "#2563eb",
                  borderColor: "#bfdbfe",
                },
              }}
            >
              <Edit sx={{ fontSize: 18 }} />
            </IconButton>

            <IconButton
              onClick={() => onDelete(item)}
              sx={{
                width: 38,
                height: 38,
                borderRadius: 1.25,
                border: "1px solid #e2e8f0",
                color: "#64748b",

                "&:hover": {
                  bgcolor: "#fef2f2",
                  color: "#dc2626",
                  borderColor: "#fecaca",
                },
              }}
            >
              <Delete sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   CLASS FORM DIALOG
========================================================= */

function ClassFormDialog({
  open,
  mode,
  form,
  setForm,
  loading,
  onClose,
  onSubmit,
}) {
  const isEdit = mode === "edit";

  const classNameError =
    form.className.length > 0 &&
    !form.className.trim();

  const sectionError =
    form.section.length > 0 &&
    !form.section.trim();

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          width: "100%",
          borderRadius: {
            xs: 2.5,
            sm: 3,
          },
          m: {
            xs: 1.5,
            sm: 2,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          px: {
            xs: 1.75,
            sm: 2.25,
          },
          py: 1.5,
          borderBottom: "1px solid #eef2f7",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: 1.5,
              bgcolor: "#eff6ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isEdit ? (
              <Edit fontSize="small" />
            ) : (
              <Add fontSize="small" />
            )}
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              {isEdit
                ? "Edit Class"
                : "Create New Class"}
            </Typography>

            <Typography
              sx={{
                fontSize: 10.5,
                color: "#94a3b8",
              }}
            >
              {isEdit
                ? "Update class and section"
                : "Add a new class and section"}
            </Typography>
          </Box>

          <IconButton
            size="small"
            onClick={onClose}
            disabled={loading}
            sx={{
              width: 36,
              height: 36,
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        sx={{
          px: {
            xs: 1.75,
            sm: 2.25,
          },
          py: 2,
        }}
      >
        <Stack spacing={1.5}>
          <TextField
            fullWidth
            size="small"
            label="Class Name"
            placeholder="e.g. 10"
            value={form.className}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                className: e.target.value,
              }))
            }
            error={classNameError}
            helperText={
              classNameError
                ? "Class name is required"
                : "Example: 1, 5, 10, 12"
            }
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <ClassOutlined fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            size="small"
            label="Section"
            placeholder="e.g. A"
            value={form.section}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                section: e.target.value,
              }))
            }
            error={sectionError}
            helperText={
              sectionError
                ? "Section is required"
                : "Example: A, B, C"
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <School fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <Alert
            severity="info"
            sx={{
              borderRadius: 1.5,
              fontSize: 11,
              py: 0.25,
            }}
          >
            Class teacher can be assigned after
            creating the class.
          </Alert>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: {
            xs: 1.75,
            sm: 2.25,
          },
          py: 1.25,
          borderTop: "1px solid #eef2f7",
          gap: 0.75,
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            minHeight: 40,
            textTransform: "none",
            color: "#64748b",
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={
            loading ||
            !form.className.trim() ||
            !form.section.trim()
          }
          startIcon={
            loading ? (
              <CircularProgress
                size={15}
                color="inherit"
              />
            ) : isEdit ? (
              <Edit />
            ) : (
              <Add />
            )
          }
          sx={{
            minHeight: 40,
            px: 1.75,
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 1.5,
            boxShadow: "none",
          }}
        >
          {loading
            ? isEdit
              ? "Saving..."
              : "Creating..."
            : isEdit
              ? "Save Changes"
              : "Create Class"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* =========================================================
   DELETE DIALOG
========================================================= */

function DeleteClassDialog({
  open,
  classItem,
  loading,
  onClose,
  onConfirm,
}) {
  if (!classItem) return null;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 2.5,
          m: {
            xs: 1.5,
            sm: 2,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 2.25,
          py: 1.75,
          display: "flex",
          alignItems: "center",
          gap: 1,
          fontWeight: 800,
          color: "#991b1b",
          fontSize: 16,
        }}
      >
        <WarningAmberOutlined color="error" />
        Delete Class
      </DialogTitle>

      <DialogContent sx={{ px: 2.25 }}>
        <Typography
          sx={{
            fontSize: 13,
            color: "#475569",
            lineHeight: 1.7,
          }}
        >
          Are you sure you want to delete{" "}
          <strong>
            Class {classItem.className} -{" "}
            {classItem.section}
          </strong>
          ?
        </Typography>

        <Alert
          severity="warning"
          sx={{
            mt: 1.5,
            borderRadius: 1.5,
            fontSize: 11.5,
          }}
        >
          This action cannot be undone.
        </Alert>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.25,
          pb: 1.75,
          gap: 0.75,
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            minHeight: 40,
            textTransform: "none",
            color: "#64748b",
          }}
        >
          Cancel
        </Button>

        <Button
          color="error"
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress
                size={15}
                color="inherit"
              />
            ) : (
              <Delete />
            )
          }
          sx={{
            minHeight: 40,
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 1.5,
            boxShadow: "none",
          }}
        >
          {loading ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function ClassesPage() {
  const {
    data: classes = [],
    isLoading,
    refetch,
    isFetching,
  } = useClasses();

  const {
    mutate: createClass,
    isPending: isCreating,
  } = useCreateClass();

  const {
    mutate: updateClass,
    isPending: isUpdating,
  } = useUpdateClass();

  const {
    mutate: deleteClass,
    isPending: isDeleting,
  } = useDeleteClass();

  const [search, setSearch] = useState("");
  const [teacherFilter, setTeacherFilter] =
    useState("ALL");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [createOpen, setCreateOpen] = useState(false);
  const [editDialog, setEditDialog] = useState(null);
  const [deleteCandidate, setDeleteCandidate] =
    useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredClasses = useMemo(() => {
    const query = normalize(search);

    return classes.filter((item) => {
      const teacherName =
        item?.classTeacher?.name || "";

      const matchesSearch =
        !query ||
        normalize(item?.className).includes(query) ||
        normalize(item?.section).includes(query) ||
        normalize(teacherName).includes(query);

      const hasTeacher = Boolean(teacherName);

      const matchesTeacher =
        teacherFilter === "ALL" ||
        (teacherFilter === "ASSIGNED" &&
          hasTeacher) ||
        (teacherFilter === "UNASSIGNED" &&
          !hasTeacher);

      return matchesSearch && matchesTeacher;
    });
  }, [classes, search, teacherFilter]);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredClasses.length / rowsPerPage
    )
  );

  const paginatedClasses = useMemo(() => {
    const start = page * rowsPerPage;

    return filteredClasses.slice(
      start,
      start + rowsPerPage
    );
  }, [
    filteredClasses,
    page,
    rowsPerPage,
  ]);

  useEffect(() => {
    setPage(0);
  }, [search, teacherFilter]);

  useEffect(() => {
    if (page > 0 && page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  /* =======================================================
     STATS
  ======================================================= */

  const stats = useMemo(() => {
    const assigned = classes.filter((item) =>
      Boolean(item?.classTeacher?.name)
    ).length;

    const uniqueClassNames = new Set(
      classes
        .map((item) =>
          normalize(item?.className)
        )
        .filter(Boolean)
    );

    return {
      totalSections: classes.length,
      uniqueClasses: uniqueClassNames.size,
      assigned,
      unassigned:
        classes.length - assigned,
    };
  }, [classes]);

  /* =======================================================
     CREATE
  ======================================================= */

  const openCreate = () => {
    setForm({
      className: "",
      section: "",
    });

    setCreateOpen(true);
  };

  const closeCreate = () => {
    if (isCreating) return;

    setCreateOpen(false);

    setForm({
      className: "",
      section: "",
    });
  };

  const handleCreate = () => {
    const className =
      form.className.trim();

    const section =
      form.section.trim();

    if (!className || !section) return;

    createClass(
      {
        className,
        section,
      },
      {
        onSuccess: () => {
          setCreateOpen(false);

          setForm({
            className: "",
            section: "",
          });

          setPage(0);
        },
      }
    );
  };

  /* =======================================================
     EDIT
  ======================================================= */

  const handleEdit = (item) => {
    if (!item?._id) return;

    setEditDialog({
      ...item,
      className: item.className || "",
      section: item.section || "",
    });
  };

  const handleUpdate = () => {
    if (!editDialog?._id) return;

    const className =
      editDialog.className?.trim();

    const section =
      editDialog.section?.trim();

    if (!className || !section) return;

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
      }
    );
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const handleDelete = () => {
    if (!deleteCandidate?._id) return;

    deleteClass(deleteCandidate._id, {
      onSuccess: () => {
        setDeleteCandidate(null);
      },
    });
  };

  /* =======================================================
     FILTERS
  ======================================================= */

  const hasFilters =
    Boolean(search) ||
    teacherFilter !== "ALL";

  const clearFilters = () => {
    setSearch("");
    setTeacherFilter("ALL");
    setPage(0);
  };

  /* =======================================================
     PAGINATION
  ======================================================= */

  const handlePageChange = (_, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    const value = Number(
      event.target.value
    );

    setRowsPerPage(value);
    setPage(0);
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100%",
        bgcolor: "#f6f8fc",

        p: {
          xs: 1,
          sm: 1.5,
          md: 1,
          lg: 1,
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1600,
          mx: "auto",
        }}
      >
        {/* =================================================
            PAGE HEADER
        ================================================= */}

        {/* <Box
          sx={{
            mb: {
              xs: 1,
              sm: 1.5,
            },
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            alignItems={{
              xs: "flex-start",
              sm: "center",
            }}
            justifyContent="space-between"
            gap={1}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: {
                    xs: 17,
                    sm: 20,
                    md: 22,
                  },
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: 1.2,
                }}
              >
                Class Management
              </Typography>

              <Typography
                sx={{
                  mt: 0.35,
                  fontSize: {
                    xs: 10.5,
                    sm: 11.5,
                  },
                  color: "#64748b",
                }}
              >
                Manage classes, sections and class teachers
              </Typography>
            </Box>
          </Stack>
        </Box>
 */}
        {/* =================================================
            STATS
        ================================================= */}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
            },
            gap: {
              xs: 0.75,
              sm: 1,
              md: 1.25,
            },
            mb: {
              xs: 1,
              sm: 1.5,
            },
          }}
        >
          <StatCard
            title="Sections"
            value={stats.totalSections}
            subtitle="Total sections"
            icon={<Groups fontSize="small" />}
            color="#2563eb"
            background="#eff6ff"
          />

          <StatCard
            title="Classes"
            value={stats.uniqueClasses}
            subtitle="Unique class levels"
            icon={<School fontSize="small" />}
            color="#7c3aed"
            background="#f5f3ff"
          />

          <StatCard
            title="Assigned"
            value={stats.assigned}
            subtitle="Teacher assigned"
            icon={
              <CheckCircleOutline fontSize="small" />
            }
            color="#059669"
            background="#ecfdf5"
          />

          <StatCard
            title="Unassigned"
            value={stats.unassigned}
            subtitle="Need teacher"
            icon={
              <WarningAmberOutlined fontSize="small" />
            }
            color="#d97706"
            background="#fffbeb"
          />
        </Box>

        {/* =================================================
            MAIN CARD
        ================================================= */}

        <Paper
          elevation={0}
          sx={{
            width: "100%",
            borderRadius: {
              xs: 2,
              sm: 2.5,
            },
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            bgcolor: "#fff",
          }}
        >
          {/* =================================================
              TOOLBAR
          ================================================= */}

         <Box
  sx={{
    px: { xs: 1.25, sm: 1.5, md: 1.75 },
    py: { xs: 1.25, sm: 1.5 },
    borderBottom: "1px solid #e2e8f0",
  }}
>
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1,
      width: "100%",

      // Mobile
      flexDirection: {
        xs: "column",
        sm: "row",
      },
      flexWrap: {
        xs: "wrap",
        sm: "nowrap",
      },
    }}
  >
    {/* =================================================
        TITLE
    ================================================= */}
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.75}
      sx={{
        flexShrink: 0,
        minWidth: {
          xs: "100%",
          sm: "auto",
        },
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          flexShrink: 0,
          borderRadius: 1.25,
          bgcolor: "#eff6ff",
          color: "#2563eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <School sx={{ fontSize: 18 }} />
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
      >
        <Typography
          sx={{
            fontSize: {
              xs: 13,
              sm: 14,
            },
            fontWeight: 800,
            color: "#0f172a",
            whiteSpace: "nowrap",
          }}
        >
          Classes
        </Typography>

        <Chip
          size="small"
          label={filteredClasses.length}
          sx={{
            height: 21,
            minWidth: 25,
            px: 0.25,
            fontSize: 10,
            fontWeight: 800,
            bgcolor: "#f1f5f9",
            color: "#475569",
            borderRadius: 1,
          }}
        />
      </Stack>
    </Stack>

    {/* =================================================
        SEARCH
    ================================================= */}
    <TextField
      fullWidth
      size="small"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search class, section or teacher..."
      sx={{
        flex: 1,
        minWidth: 0,

        "& .MuiOutlinedInput-root": {
          height: 36,
          fontSize: 11.5,
          borderRadius: 1.25,
          bgcolor: "#fff",

          "& fieldset": {
            borderColor: "#e2e8f0",
          },

          "&:hover fieldset": {
            borderColor: "#cbd5e1",
          },

          "&.Mui-focused fieldset": {
            borderColor: "#2563eb",
            borderWidth: 1,
          },
        },

        // Mobile
        width: {
          xs: "100%",
          sm: "auto",
        },
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search
              sx={{
                fontSize: 18,
                color: "#94a3b8",
              }}
            />
          </InputAdornment>
        ),

        endAdornment: search ? (
          <InputAdornment position="end">
            <IconButton
              size="small"
              onClick={() => setSearch("")}
              sx={{
                width: 26,
                height: 26,
              }}
            >
              <Close sx={{ fontSize: 16 }} />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
    />

    {/* =================================================
        FILTER
    ================================================= */}
    <TextField
      select
      size="small"
      value={teacherFilter}
      onChange={(e) =>
        setTeacherFilter(e.target.value)
      }
      sx={{
        flexShrink: 0,

        width: {
          xs: "100%",
          sm: 145,
          md: 155,
        },

        "& .MuiOutlinedInput-root": {
          height: 36,
          fontSize: 11.5,
          borderRadius: 1.25,
          bgcolor: "#fff",

          "& fieldset": {
            borderColor: "#e2e8f0",
          },

          "&:hover fieldset": {
            borderColor: "#cbd5e1",
          },

          "&.Mui-focused fieldset": {
            borderColor: "#2563eb",
            borderWidth: 1,
          },
        },
      }}
    >
      <MenuItem value="ALL">
        All Teachers
      </MenuItem>

      <MenuItem value="ASSIGNED">
        Assigned
      </MenuItem>

      <MenuItem value="UNASSIGNED">
        Unassigned
      </MenuItem>
    </TextField>

    {/* =================================================
        REFRESH
    ================================================= */}
    <Tooltip title="Refresh">
      <span>
        <IconButton
          onClick={() => refetch()}
          disabled={isFetching}
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
            border: "1px solid #e2e8f0",
            borderRadius: 1.25,
            color: "#64748b",
            bgcolor: "#fff",

            "&:hover": {
              bgcolor: "#f8fafc",
              borderColor: "#cbd5e1",
              color: "#2563eb",
            },
          }}
        >
          {isFetching ? (
            <CircularProgress size={16} />
          ) : (
            <Refresh fontSize="small" />
          )}
        </IconButton>
      </span>
    </Tooltip>

    {/* =================================================
        ADD CLASS
    ================================================= */}
    <Button
      variant="contained"
      size="small"
      startIcon={<Add />}
      onClick={openCreate}
      sx={{
        height: 36,
        minWidth: 110,
        flexShrink: 0,
        px: 1.5,
        borderRadius: 1.25,
        textTransform: "none",
        fontSize: 11.5,
        fontWeight: 700,
        boxShadow: "none",
        whiteSpace: "nowrap",

        "&:hover": {
          boxShadow: "none",
        },

        // Mobile
        width: {
          xs: "100%",
          sm: "auto",
        },
      }}
    >
      Add Class
    </Button>
  </Box>
</Box>

          {/* =================================================
              DESKTOP TABLE
          ================================================= */}

          <Box
            sx={{
              display: {
                xs: "none",
                md: "block",
              },
            }}
          >
            <TableContainer>
              <Table
                stickyHeader
                size="small"
                sx={{
                  minWidth: 760,

                  "& .MuiTableCell-root": {
                    px: 1.75,
                    py: 1,
                    borderBottom:
                      "1px solid #f1f5f9",
                  },

                  "& .MuiTableRow-root:hover": {
                    bgcolor: "#fafcff",
                  },
                }}
              >
  <TableHead>
  <TableRow
    sx={{
      "& th": {
        backgroundColor: "#4f1da5 !important",
        color: "#ffffff !important",

        height: 42,
        px: 1.5,
        py: 0.5,

        verticalAlign: "middle",
        borderBottom: "none",
      },

      "& th:first-of-type": {
        borderTopLeftRadius: "10px",
      },

      "& th:last-of-type": {
        borderTopRightRadius: "10px",
      },
    }}
  >
    {[
      ["Class", "22%"],
      ["Section", "14%"],
      ["Class Teacher", "30%"],
      ["Status", "18%"],
      ["Actions", "16%"],
    ].map(([label, width], index) => (
      <TableCell
        key={label}
        align={index === 4 ? "right" : "left"}
        sx={{
          width,
          px: 1.5,
          py: 0.5,

          fontSize: "10px",
          fontWeight: 700,
          lineHeight: 1.1,

          color: "#ffffff !important",
          textTransform: "uppercase",
          letterSpacing: "0.04em",

          whiteSpace: "nowrap",

          "&:not(:last-child)": {
            borderRight:
              "1px solid rgba(255,255,255,0.16)",
          },
        }}
      >
        {label}
      </TableCell>
    ))}
  </TableRow>
</TableHead>

                <TableBody>
                  {isLoading ? (
                    <LoadingRows />
                  ) : paginatedClasses.length ===
                    0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <EmptyState
                          search={search}
                          hasFilters={
                            hasFilters
                          }
                          onClear={
                            clearFilters
                          }
                          onAdd={
                            openCreate
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedClasses.map(
                      (item) => {
                        const teacherName =
                          item?.classTeacher
                            ?.name || "";

                        const hasTeacher =
                          Boolean(
                            teacherName
                          );

                        return (
                          <TableRow
                            key={item?._id}
                            hover
                          >
                            {/* CLASS */}

                            <TableCell>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                              >
                                <Box
                                  sx={{
                                    width: 34,
                                    height: 34,
                                    flexShrink: 0,
                                    borderRadius: 1.25,
                                    bgcolor:
                                      "#eff6ff",
                                    color:
                                      "#2563eb",
                                    display:
                                      "flex",
                                    alignItems:
                                      "center",
                                    justifyContent:
                                      "center",
                                  }}
                                >
                                  <School
                                    sx={{
                                      fontSize: 18,
                                    }}
                                  />
                                </Box>

                                <Box>
                                  <Typography
                                    sx={{
                                      fontSize: 12,
                                      fontWeight: 800,
                                      color:
                                        "#1e293b",
                                    }}
                                  >
                                    Class{" "}
                                    {item?.className ||
                                      "—"}
                                  </Typography>

                                  <Typography
                                    sx={{
                                      fontSize: 9,
                                      color:
                                        "#94a3b8",
                                    }}
                                  >
                                    Academic class
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>

                            {/* SECTION */}

                            <TableCell>
                              <Chip
                                label={
                                  item?.section ||
                                  "—"
                                }
                                size="small"
                                sx={{
                                  minWidth: 36,
                                  height: 24,
                                  borderRadius: 1,
                                  bgcolor:
                                    "#f1f5f9",
                                  color:
                                    "#334155",
                                  fontWeight: 800,
                                  fontSize: 10.5,
                                }}
                              />
                            </TableCell>

                            {/* TEACHER */}

                            <TableCell>
                              {hasTeacher ? (
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  spacing={1}
                                >
                                  <Avatar
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      fontSize: 10,
                                      fontWeight: 800,
                                      bgcolor:
                                        getAvatarColor(
                                          teacherName
                                        ),
                                    }}
                                  >
                                    {getInitials(
                                      teacherName
                                    )}
                                  </Avatar>

                                  <Box
                                    sx={{
                                      minWidth: 0,
                                    }}
                                  >
                                    <Typography
                                      noWrap
                                      sx={{
                                        maxWidth: 230,
                                        fontSize: 11.5,
                                        fontWeight: 700,
                                        color:
                                          "#334155",
                                      }}
                                    >
                                      {
                                        teacherName
                                      }
                                    </Typography>

                                    <Typography
                                      sx={{
                                        fontSize: 9,
                                        color:
                                          "#94a3b8",
                                      }}
                                    >
                                      Class Teacher
                                    </Typography>
                                  </Box>
                                </Stack>
                              ) : (
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  spacing={1}
                                >
                                  <Avatar
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      bgcolor:
                                        "#f8fafc",
                                      color:
                                        "#94a3b8",
                                    }}
                                  >
                                    <PersonOutline
                                      sx={{
                                        fontSize: 17,
                                      }}
                                    />
                                  </Avatar>

                                  <Box>
                                    <Typography
                                      sx={{
                                        fontSize: 11.5,
                                        fontWeight: 600,
                                        color:
                                          "#94a3b8",
                                      }}
                                    >
                                      Not assigned
                                    </Typography>

                                    <Typography
                                      sx={{
                                        fontSize: 9,
                                        color:
                                          "#cbd5e1",
                                      }}
                                    >
                                      Teacher required
                                    </Typography>
                                  </Box>
                                </Stack>
                              )}
                            </TableCell>

                            {/* STATUS */}

                            <TableCell>
                              {hasTeacher ? (
                                <Chip
                                  icon={
                                    <CheckCircleOutline
                                      sx={{
                                        fontSize:
                                          "14px !important",
                                      }}
                                    />
                                  }
                                  label="Ready"
                                  size="small"
                                  color="success"
                                  sx={{
                                    height: 24,
                                    borderRadius: 1,
                                    fontWeight: 700,
                                    fontSize: 9.5,
                                  }}
                                />
                              ) : (
                                <Chip
                                  icon={
                                    <WarningAmberOutlined
                                      sx={{
                                        fontSize:
                                          "14px !important",
                                      }}
                                    />
                                  }
                                  label="Needs Teacher"
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                  sx={{
                                    height: 24,
                                    borderRadius: 1,
                                    fontWeight: 700,
                                    fontSize: 9.5,
                                  }}
                                />
                              )}
                            </TableCell>

                            {/* ACTIONS */}

                            <TableCell align="right">
                              <Stack
                                direction="row"
                                justifyContent="flex-end"
                                spacing={0.5}
                              >
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleEdit(
                                        item
                                      )
                                    }
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      color:
                                        "#64748b",
                                      borderRadius:
                                        1,

                                      "&:hover":
                                        {
                                          bgcolor:
                                            "#eff6ff",
                                          color:
                                            "#2563eb",
                                        },
                                    }}
                                  >
                                    <Edit
                                      sx={{
                                        fontSize: 17,
                                      }}
                                    />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      setDeleteCandidate(
                                        item
                                      )
                                    }
                                    disabled={
                                      !item?._id ||
                                      isDeleting
                                    }
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      color:
                                        "#64748b",
                                      borderRadius:
                                        1,

                                      "&:hover":
                                        {
                                          bgcolor:
                                            "#fef2f2",
                                          color:
                                            "#dc2626",
                                        },
                                    }}
                                  >
                                    <Delete
                                      sx={{
                                        fontSize: 17,
                                      }}
                                    />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      }
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* =================================================
              MOBILE CARDS
          ================================================= */}

          <Box
            sx={{
              display: {
                xs: "block",
                md: "none",
              },
              p: {
                xs: 1,
                sm: 1.5,
              },
              bgcolor: "#f8fafc",
            }}
          >
            {isLoading ? (
              <MobileLoadingCards />
            ) : paginatedClasses.length === 0 ? (
              <Box
                sx={{
                  bgcolor: "#fff",
                  borderRadius: 2,
                  border:
                    "1px solid #e2e8f0",
                }}
              >
                <EmptyState
                  search={search}
                  hasFilters={hasFilters}
                  onClear={clearFilters}
                  onAdd={openCreate}
                />
              </Box>
            ) : (
              <Stack spacing={1}>
                {paginatedClasses.map(
                  (item) => (
                    <MobileClassCard
                      key={item?._id}
                      item={item}
                      onEdit={handleEdit}
                      onDelete={
                        setDeleteCandidate
                      }
                    />
                  )
                )}
              </Stack>
            )}
          </Box>

          {/* =================================================
              PAGINATION
          ================================================= */}

          {!isLoading &&
            filteredClasses.length > 0 && (
              <Box
                sx={{
                  borderTop:
                    "1px solid #e2e8f0",
                  bgcolor: "#fff",
                  overflowX: "auto",
                }}
              >
                <TablePagination
                  component="div"
                  count={filteredClasses.length}
                  page={page}
                  onPageChange={
                    handlePageChange
                  }
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={
                    handleRowsPerPageChange
                  }
                  rowsPerPageOptions={
                    PAGE_SIZE_OPTIONS
                  }
                  labelRowsPerPage="Rows:"
                  labelDisplayedRows={({
                    from,
                    to,
                    count,
                  }) =>
                    `${from}–${to} of ${count}`
                  }
                  sx={{
                    minHeight: {
                      xs: 52,
                      sm: 48,
                    },

                    ".MuiTablePagination-toolbar":
                      {
                        minHeight: {
                          xs: 52,
                          sm: 48,
                        },

                        px: {
                          xs: 0.5,
                          sm: 1,
                        },

                        gap: 0.25,
                      },

                    ".MuiTablePagination-selectLabel":
                      {
                        fontSize: {
                          xs: 9,
                          sm: 10.5,
                        },
                        color: "#64748b",
                      },

                    ".MuiTablePagination-displayedRows":
                      {
                        fontSize: {
                          xs: 9,
                          sm: 10.5,
                        },
                        color: "#64748b",
                        fontWeight: 600,
                      },

                    ".MuiTablePagination-select":
                      {
                        fontSize: {
                          xs: 9,
                          sm: 10.5,
                        },
                      },

                    ".MuiTablePagination-actions button":
                      {
                        width: 32,
                        height: 32,
                      },
                  }}
                />
              </Box>
            )}
        </Paper>
      </Box>

      {/* =================================================
          CREATE
      ================================================= */}

      <ClassFormDialog
        open={createOpen}
        mode="create"
        form={form}
        setForm={setForm}
        loading={isCreating}
        onClose={closeCreate}
        onSubmit={handleCreate}
      />

      {/* =================================================
          EDIT
      ================================================= */}

      <ClassFormDialog
        open={Boolean(editDialog)}
        mode="edit"
        form={{
          className:
            editDialog?.className || "",
          section:
            editDialog?.section || "",
        }}
        setForm={(updater) => {
          setEditDialog((prev) => {
            if (!prev) return prev;

            const current = {
              className:
                prev.className || "",
              section:
                prev.section || "",
            };

            const next =
              typeof updater === "function"
                ? updater(current)
                : updater;

            return {
              ...prev,
              className:
                next.className,
              section:
                next.section,
            };
          });
        }}
        loading={isUpdating}
        onClose={() => {
          if (!isUpdating) {
            setEditDialog(null);
          }
        }}
        onSubmit={handleUpdate}
      />

      {/* =================================================
          DELETE
      ================================================= */}

      <DeleteClassDialog
        open={Boolean(deleteCandidate)}
        classItem={deleteCandidate}
        loading={isDeleting}
        onClose={() => {
          if (!isDeleting) {
            setDeleteCandidate(null);
          }
        }}
        onConfirm={handleDelete}
      />
    </Box>
  );
}