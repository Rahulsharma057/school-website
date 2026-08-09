"use client";

import { useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  getSchoolClasses,
  createSchoolClass,
  updateSchoolClass,
  deleteSchoolClass,
} from "@/services/schoolClassService";

import ConfirmationDialog from "@/components/common/ConfirmationDialog";

export default function SchoolClassManager() {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["school-classes", { includeInactive: true }],
    queryFn: async () => {
      const res = await getSchoolClasses({ includeInactive: "true" });
      return res.data;
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["school-classes"] });

  const createMutation = useMutation({
    mutationFn: (payload) => createSchoolClass(payload),
    onSuccess: () => {
      toast.success("Class added");
      setName("");
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Could not add class"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }) => updateSchoolClass(id, { status }),
    onSuccess: () => invalidate(),
    onError: () => toast.error("Could not update class"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteSchoolClass(id),
    onSuccess: () => {
      toast.success("Class deleted");
      invalidate();
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Could not delete class"),
  });

 const classes = Array.isArray(data?.data) ? data.data : [];
  const handleAdd = () => {
    if (!name.trim()) {
      toast.error("Class name is required");
      return;
    }
    createMutation.mutate({ name: name.trim(), order: classes.length });
  };

  return (
    <Card variant="outlined" sx={{ border: "1px solid #e4e4e7", boxShadow: "none" }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: "#18181b", mb: 0.5 }}>
          Classes
        </Typography>
        <Typography sx={{ fontSize: 13, color: "#71717a", mb: 2 }}>
          Add each class once here — it stays available in every syllabus's
          class dropdown from then on.
        </Typography>

        <Stack direction="row" spacing={1.5} mb={3}>
          <TextField
            size="small"
            placeholder="e.g. Class 10, Nursery, Grade 5-A"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            disableElevation
            startIcon={<AddIcon />}
            onClick={handleAdd}
            disabled={createMutation.isPending}
            sx={{ bgcolor: "#18181b", textTransform: "none", fontWeight: 600, "&:hover": { bgcolor: "#27272a" } }}
          >
            Add
          </Button>
        </Stack>

        {!isLoading && classes.length === 0 && (
          <Typography sx={{ fontSize: 13, color: "#a1a1aa" }}>
            No classes yet — add your first one above.
          </Typography>
        )}

        <Stack spacing={1}>
          {classes.map((c) => (
            <Stack
              key={c._id}
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{ p: 1.2, border: "1px solid #e4e4e7", borderRadius: 1.5 }}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 600, flex: 1, color: "#18181b" }}>
                {c.name}
              </Typography>

              <Chip
                label={c.status ? "Active" : "Inactive"}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: 11,
                  bgcolor: c.status ? "#dcfce7" : "#f4f4f5",
                  color: c.status ? "#15803d" : "#71717a",
                }}
              />

              <Switch
                size="small"
                checked={c.status}
                onChange={(e) => toggleMutation.mutate({ id: c._id, status: e.target.checked })}
              />

              <Tooltip title="Delete class">
                <IconButton size="small" onClick={() => setDeleteTarget(c)} sx={{ color: "#dc2626" }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          ))}
        </Stack>

        <ConfirmationDialog
          open={Boolean(deleteTarget)}
          title="Delete Class"
          message={`Delete "${deleteTarget?.name}"? Only works if no syllabus currently uses this class.`}
          loading={deleteMutation.isPending}
          confirmText="Delete"
          onClose={() => setDeleteTarget(null)}
      onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        />
      </CardContent>
    </Card>
  );
}