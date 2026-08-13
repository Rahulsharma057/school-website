"use client";

import { useEffect, useState } from "react";

import {
  Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  LinearProgress, Stack, Typography,
} from "@mui/material";
import SmsIcon from "@mui/icons-material/Sms";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { buildSmsLink } from "@/utils/smsHelper";

// `queue` items: { id, name, phone, message }
// NOTE: mobile browsers only allow opening the native SMS app in direct
// response to a tap — they won't let us silently fire 20 "sms:" links back
// to back. So "Send All" here is a guided one-tap-per-student flow: it
// shows each student, you tap "Send SMS" (opens the device's own Messages
// app pre-filled, free — no gateway), then it auto-advances to the next.
export default function SendReminderQueueDialog({ open, onClose, queue = [] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const current = queue[index];
  const done = index >= queue.length;

  const handleSend = () => {
    if (!current?.phone) return;
    const link = buildSmsLink(current.phone, current.message);
    if (link) window.location.href = link;
    setTimeout(() => setIndex((i) => i + 1), 500);
  };

  const handleSkip = () => setIndex((i) => i + 1);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Send Fee Reminders</DialogTitle>
      <DialogContent>
        {!done && (
          <LinearProgress
            variant="determinate"
            value={queue.length ? (index / queue.length) * 100 : 0}
            sx={{ height: 6, borderRadius: 3, mb: 2.5, bgcolor: "#f4f4f5" }}
          />
        )}

        {done ? (
          <Stack alignItems="center" spacing={1.5} sx={{ py: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 44, color: "#15803d" }} />
            <Typography sx={{ fontWeight: 700 }}>All done</Typography>
            <Typography sx={{ fontSize: 13, color: "#71717a", textAlign: "center" }}>
              Went through {queue.length} student{queue.length === 1 ? "" : "s"}. Any you skipped can be reminded again from the Due List.
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Typography sx={{ fontSize: 12.5, color: "#a1a1aa" }}>
              {index + 1} of {queue.length}
            </Typography>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: "#18181b", fontSize: 14 }}>
                {current?.name?.[0]?.toUpperCase() || "?"}
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 700 }}>{current?.name}</Typography>
                <Typography sx={{ fontSize: 12.5, color: "#71717a" }}>
                  {current?.phone || "No parent phone on file"}
                </Typography>
              </Box>
            </Stack>

            <Box sx={{ p: 1.5, bgcolor: "#fafafa", border: "1px solid #e4e4e7", borderRadius: 1.5 }}>
              <Typography sx={{ fontSize: 12.5, color: "#3f3f46" }}>{current?.message}</Typography>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        {done ? (
          <Button onClick={onClose} variant="contained" disableElevation sx={{ bgcolor: "#18181b", textTransform: "none", fontWeight: 600 }}>
            Close
          </Button>
        ) : (
          <>
            <Button onClick={onClose} sx={{ textTransform: "none", color: "#71717a" }}>Cancel</Button>
            <Button
              startIcon={<SkipNextIcon />}
              onClick={handleSkip}
              sx={{ textTransform: "none", color: "#71717a" }}
            >
              Skip
            </Button>
            <Button
              startIcon={<SmsIcon />}
              variant="contained"
              disableElevation
              disabled={!current?.phone}
              onClick={handleSend}
              sx={{ bgcolor: "#15803d", textTransform: "none", fontWeight: 600, "&:hover": { bgcolor: "#166534" } }}
            >
              Send SMS
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
