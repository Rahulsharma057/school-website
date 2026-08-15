"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PortalGuard from "@/components/PortalGuard";
import {
  Box, Typography, Paper, Chip, Stack, TextField, Button, IconButton,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import { ArrowBack, Send, CheckCircleOutline, ReportProblemOutlined, PlayArrowOutlined } from "@mui/icons-material";
import { useTaskById, useAddTaskMessage, useUpdateTaskStatus } from "@/hooks/useTask";
import { useAuth } from "@/context/AuthContext";

const statusColor = { PENDING: "default", IN_PROGRESS: "info", COMPLETED: "success", PROBLEM: "error" };
const priorityColor = { LOW: "default", MEDIUM: "warning", HIGH: "error" };

function TaskDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { data: task, isLoading } = useTaskById(id);
  const { mutate: sendMessage, isPending: sending } = useAddTaskMessage();
  const { mutate: updateStatus, isPending: updating } = useUpdateTaskStatus();

  const [messageText, setMessageText] = useState("");
  const [statusDialog, setStatusDialog] = useState(null); // "COMPLETED" | "PROBLEM"
  const [note, setNote] = useState("");

  const handleSend = () => {
    if (!messageText.trim()) return;
    sendMessage({ id, data: { message: messageText } }, { onSuccess: () => setMessageText("") });
  };

  const handleMarkInProgress = () => {
    updateStatus({ id, data: { status: "IN_PROGRESS", note: "" } });
  };

  const openStatusDialog = (status) => {
    setStatusDialog(status);
    setNote("");
  };

  const handleStatusSubmit = () => {
    if (statusDialog === "PROBLEM" && !note.trim()) return;
    updateStatus(
      { id, data: { status: statusDialog, note } },
      { onSuccess: () => setStatusDialog(null) }
    );
  };

  if (isLoading) return <CircularProgress />;
  if (!task) return <Typography>Task not found</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Button startIcon={<ArrowBack />} onClick={() => router.push("/portal/tasks")} sx={{ textTransform: "none", mb: 2 }}>
        Back to My Tasks
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

        <Typography variant="body2" sx={{ color: "#64748b", mt: 2 }}>Assigned by: <b>{task.assignedBy?.name}</b></Typography>
        {task.dueDate && <Typography variant="body2" sx={{ color: "#64748b" }}>Due: <b>{new Date(task.dueDate).toLocaleDateString("en-IN")}</b></Typography>}

        {/* Action buttons — sirf tab dikhayein jab task complete na ho */}
        {task.status !== "COMPLETED" && (
          <Stack direction="row" spacing={1.5} sx={{ mt: 3 }} flexWrap="wrap" rowGap={1}>
            {task.status === "PENDING" && (
              <Button
                variant="outlined" startIcon={<PlayArrowOutlined />} onClick={handleMarkInProgress}
                disabled={updating} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
              >
                Start Task
              </Button>
            )}
            <Button
              variant="contained" color="success" startIcon={<CheckCircleOutline />}
              onClick={() => openStatusDialog("COMPLETED")}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
            >
              Mark Completed
            </Button>
            <Button
              variant="outlined" color="error" startIcon={<ReportProblemOutlined />}
              onClick={() => openStatusDialog("PROBLEM")}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
            >
              Report Problem
            </Button>
          </Stack>
        )}
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

      {/* Status Update Dialog */}
      <Dialog open={!!statusDialog} onClose={() => setStatusDialog(null)} PaperProps={{ sx: { borderRadius: 3, minWidth: 380 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {statusDialog === "COMPLETED" ? "Mark Task as Completed" : "Report a Problem"}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth multiline rows={3} size="small"
            label={statusDialog === "COMPLETED" ? "Notes (optional)" : "Describe the problem"}
            value={note} onChange={(e) => setNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setStatusDialog(null)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button
            variant="contained"
            color={statusDialog === "COMPLETED" ? "success" : "error"}
            onClick={handleStatusSubmit}
            disabled={updating || (statusDialog === "PROBLEM" && !note.trim())}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
          >
            {updating ? "Saving..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function MyTaskDetailPage() {
  return (
    <PortalGuard allowedRoles={["TEACHER"]}>
      <TaskDetailContent />
    </PortalGuard>
  );
}