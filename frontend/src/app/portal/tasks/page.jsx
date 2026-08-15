"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PortalGuard from "@/components/PortalGuard";
import {
  Box, Typography, Paper, Select, MenuItem, Table, TableHead, TableBody,
  TableRow, TableCell, Chip, Stack, Pagination,
} from "@mui/material";
import { useMyTasks } from "@/hooks/useTask";

const statusColor = { PENDING: "default", IN_PROGRESS: "info", COMPLETED: "success", PROBLEM: "error" };
const priorityColor = { LOW: "default", MEDIUM: "warning", HIGH: "error" };

function MyTasksContent() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useMyTasks({ status: statusFilter || undefined, page, limit: 15 });
  const tasks = data?.tasks || [];

  return (
    <Box>
      <Typography variant="h4" mb={1}>My Tasks</Typography>
      <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>Tasks assigned to you by the school administration</Typography>

      <Paper elevation={0} sx={{ p: 2, mb: 3, border: "1px solid #e2e8f0", borderRadius: 3 }}>
        <Select size="small" displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} sx={{ minWidth: 180 }}>
          <MenuItem value="">All Status</MenuItem>
          <MenuItem value="PENDING">Pending</MenuItem>
          <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
          <MenuItem value="COMPLETED">Completed</MenuItem>
          <MenuItem value="PROBLEM">Problem</MenuItem>
        </Select>
      </Paper>

      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f8fafc" }}>
              <TableCell>Title</TableCell>
              <TableCell>Assigned By</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((t) => (
              <TableRow key={t._id} hover sx={{ cursor: "pointer" }} onClick={() => router.push(`/portal/tasks/${t._id}`)}>
                <TableCell sx={{ fontWeight: 600 }}>{t.title}</TableCell>
                <TableCell>{t.assignedBy?.name}</TableCell>
                <TableCell><Chip label={t.priority} size="small" color={priorityColor[t.priority]} /></TableCell>
                <TableCell>{t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-IN") : "—"}</TableCell>
                <TableCell><Chip label={t.status.replace("_", " ")} size="small" color={statusColor[t.status]} /></TableCell>
              </TableRow>
            ))}
            {!isLoading && tasks.length === 0 && (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: "#94a3b8" }}>No tasks assigned yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {data?.totalPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination count={data.totalPages} page={page} onChange={(e, val) => setPage(val)} color="primary" />
        </Stack>
      )}
    </Box>
  );
}

export default function MyTasksPage() {
  return (
    <PortalGuard allowedRoles={["TEACHER"]}>
      <Box sx={{ p: 3 }}>
        <MyTasksContent />
      </Box>
    </PortalGuard>
  );
}