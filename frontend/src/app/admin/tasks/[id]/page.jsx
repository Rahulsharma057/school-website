"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box, Typography, Paper, Chip, Stack, TextField, Button, Avatar,
  IconButton, CircularProgress,
} from "@mui/material";
import { ArrowBack, Send } from "@mui/icons-material";
import AdminGuard from "@/components/admin/AdminGuard";
import { useTaskById, useAddTaskMessage } from "@/hooks/useTask";
import { useAuth } from "@/context/AuthContext";

const statusColor = { PENDING: "default", IN_PROGRESS: "info", COMPLETED: "success", PROBLEM: "error" };
const priorityColor = { LOW: "default", MEDIUM: "warning", HIGH: "error" };

function TaskDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { data: task, isLoading } = useTaskById(id);
  const { mutate: sendMessage, isPending: sending } = useAddTaskMessage();

  const [messageText, setMessageText] = useState("");

  const handleSend = () => {
    if (!messageText.trim()) return;
    sendMessage({ id, data: { message: messageText } }, { onSuccess: () => setMessageText("") });
  };

  if (isLoading) return <CircularProgress />;
  if (!task) return <Typography>Task not found</Typography>;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <Button startIcon={<ArrowBack />} onClick={() => router.push("/admin/tasks")} sx={{ textTransform: "none", mb: 2 }}>
        Back to Tasks
      </Button>

      <Paper elevation={0} sx={{ p: 3, mb: 3, border: "1px solid #e2e8f0", borderRadius: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" rowGap={1}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{task.title}</Typography>
            <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>{task.description || "No description"}</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip label={task.priority} size="small" color={priorityColor[task.priority]} />
            <Chip label={task.status.replace("_", " ")} size="small" color={statusColor[task.status]} />
          </Stack>
        </Stack>

        <Stack direction="row" spacing={4} sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ color: "#64748b" }}>Assigned to: <b>{task.assignedTo?.name}</b></Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>Assigned by: <b>{task.assignedBy?.name}</b></Typography>
          {task.dueDate && <Typography variant="body2" sx={{ color: "#64748b" }}>Due: <b>{new Date(task.dueDate).toLocaleDateString("en-IN")}</b></Typography>}
        </Stack>
      </Paper>

      {/* Chat Thread */}
      <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Discussion</Typography>

        <Stack spacing={1.5} sx={{ maxHeight: 400, overflowY: "auto", mb: 2 }}>
          {task.messages?.map((m) => {
            const isMine = m.sender?._id === user?._id || m.sender?.name === user?.name;
            return (
              <Box key={m._id} sx={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                <Box sx={{ maxWidth: "70%", p: 1.5, borderRadius: 2, backgroundColor: isMine ? "#2563eb" : "#f1f5f9", color: isMine ? "#fff" : "#1e293b" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.8, display: "block" }}>
                    {m.sender?.name} {m.sender?.role ? `(${m.sender.role})` : ""}
                  </Typography>
                  <Typography variant="body2">{m.message}</Typography>
                </Box>
              </Box>
            );
          })}
          {(!task.messages || task.messages.length === 0) && (
            <Typography variant="body2" sx={{ color: "#94a3b8", textAlign: "center", py: 2 }}>No messages yet</Typography>
          )}
        </Stack>

        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth size="small" placeholder="Type a message..."
            value={messageText} onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <IconButton color="primary" onClick={handleSend} disabled={sending}>
            <Send />
          </IconButton>
        </Stack>
      </Paper>
    </Box>
  );
}

export default function TaskDetailPage() {
  return (
    <AdminGuard>
      <TaskDetailContent />
    </AdminGuard>
  );
}