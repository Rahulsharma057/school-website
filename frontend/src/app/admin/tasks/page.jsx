"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Typography, Paper, TextField, Button, Select, MenuItem,
  Table, TableHead, TableBody, TableRow, TableCell, Chip, Stack,
  Avatar, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Pagination,
} from "@mui/material";
import { AssignmentOutlined, Delete, Visibility } from "@mui/icons-material";
import AdminGuard from "@/components/admin/AdminGuard";
import { useAllTeachers } from "@/hooks/useTeacher";
import { useCreateTask, useAllTasks, useDeleteTask, useTaskStats } from "@/hooks/useTask";

const statusColor = { PENDING: "default", IN_PROGRESS: "info", COMPLETED: "success", PROBLEM: "error" };
const priorityColor = { LOW: "default", MEDIUM: "warning", HIGH: "error" };

function TasksContent() {
  const router = useRouter();
  const { data: teachers = [] } = useAllTeachers();
  const { data: stats } = useTaskStats();

  const [statusFilter, setStatusFilter] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAllTasks({
    status: statusFilter || undefined,
    teacherId: teacherFilter || undefined,
    page,
    limit: 15,
  });

  const { mutate: createTask, isPending: creating } = useCreateTask();
  const { mutate: deleteTaskFn } = useDeleteTask();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", assignedTo: "", priority: "MEDIUM", dueDate: "", message: "" });

  const handleCreate = () => {
    if (!form.title || !form.assignedTo) return;
    createTask(form, {
      onSuccess: () => {
        setCreateOpen(false);
        setForm({ title: "", description: "", assignedTo: "", priority: "MEDIUM", dueDate: "", message: "" });
      },
    });
  };

  const tasks = data?.tasks || [];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }} flexWrap="wrap" rowGap={2}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar sx={{ bgcolor: "#fef3c7", color: "#d97706", width: 44, height: 44 }}>
            <AssignmentOutlined />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>Tasks</Typography>
            <Typography variant="body2" sx={{ color: "#64748b" }}>Assign and track tasks given to teachers</Typography>
          </Box>
        </Stack>
        <Button variant="contained" onClick={() => setCreateOpen(true)} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}>
          + Assign New Task
        </Button>
      </Stack>

      {/* Stats */}
      {stats && (
        <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap" rowGap={2}>
          {Object.entries(stats).map(([key, val]) => (
            <Paper key={key} elevation={0} sx={{ p: 2, minWidth: 130, border: "1px solid #e2e8f0", borderRadius: 3 }}>
              <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700 }}>{key.replace("_", " ")}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>{val}</Typography>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Filters */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: "1px solid #e2e8f0", borderRadius: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Select size="small" displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} sx={{ minWidth: 160 }}>
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="PROBLEM">Problem</MenuItem>
          </Select>
          <Select size="small" displayEmpty value={teacherFilter} onChange={(e) => { setTeacherFilter(e.target.value); setPage(1); }} sx={{ minWidth: 200 }}>
            <MenuItem value="">All Teachers</MenuItem>
            {teachers.map((t) => <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
          </Select>
        </Stack>
      </Paper>

      {/* Table */}
      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f8fafc" }}>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Assigned To</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Priority</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Due Date</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((t) => (
              <TableRow key={t._id} hover sx={{ cursor: "pointer" }} onClick={() => router.push(`/admin/tasks/${t._id}`)}>
                <TableCell sx={{ fontWeight: 600 }}>{t.title}</TableCell>
                <TableCell>{t.assignedTo?.name}</TableCell>
                <TableCell><Chip label={t.priority} size="small" color={priorityColor[t.priority]} /></TableCell>
                <TableCell>{t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-IN") : "—"}</TableCell>
                <TableCell><Chip label={t.status.replace("_", " ")} size="small" color={statusColor[t.status]} /></TableCell>
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  <IconButton size="small" onClick={() => router.push(`/admin/tasks/${t._id}`)}>
                    <Visibility fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => { if (confirm("Delete this task?")) deleteTaskFn(t._id); }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && tasks.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "#94a3b8" }}>No tasks found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {data?.totalPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination count={data.totalPages} page={page} onChange={(e, val) => setPage(val)} color="primary" />
        </Stack>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} PaperProps={{ sx: { borderRadius: 3, minWidth: 420 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Assign New Task</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Title" size="small" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <TextField label="Description" size="small" multiline rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Select size="small" displayEmpty value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
            <MenuItem value="" disabled>Select Teacher</MenuItem>
            {teachers.map((t) => <MenuItem key={t._id} value={t._id}>{t.name} ({t.email})</MenuItem>)}
          </Select>
          <Stack direction="row" spacing={2}>
            <Select size="small" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} sx={{ flex: 1 }}>
              <MenuItem value="LOW">Low</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
            </Select>
            <TextField type="date" size="small" label="Due Date" InputLabelProps={{ shrink: true }} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} sx={{ flex: 1 }} />
          </Stack>
          <TextField label="Message / Instructions (optional)" size="small" multiline rows={2} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}>
            {creating ? "Assigning..." : "Assign Task"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function TasksPage() {
  return (
    <AdminGuard>
      <TasksContent />
    </AdminGuard>
  );
}