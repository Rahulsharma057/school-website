"use client";

import { useState } from "react";
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, Button, Select, MenuItem, Stack, Avatar, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, ToggleButtonGroup, ToggleButton,
} from "@mui/material";
import { EventBusy, Check, Close } from "@mui/icons-material";
import { useAllLeaveRequests, useReviewLeaveRequest } from "@/hooks/useLeaveRequest";

const statusColor = { PENDING: "warning", APPROVED: "success", REJECTED: "error" };

export default function LeaveRequestsPage() {
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const { data: leaves = [] } = useAllLeaveRequests(statusFilter ? { status: statusFilter } : {});
  const { mutate: reviewLeave, isPending } = useReviewLeaveRequest();

  const [reviewDialog, setReviewDialog] = useState(null); // { leave, action }
  const [leaveType, setLeaveType] = useState("PAID");
  const [reviewNote, setReviewNote] = useState("");

  const openReview = (leave, action) => {
    setReviewDialog({ leave, action });
    setLeaveType("PAID");
    setReviewNote("");
  };

  const handleSubmitReview = () => {
    if (!reviewDialog) return;

    const payload = {
      status: reviewDialog.action, // APPROVED / REJECTED
      reviewNote,
    };
    if (reviewDialog.action === "APPROVED") {
      payload.leaveType = leaveType;
    }

    reviewLeave(
      { id: reviewDialog.leave._id, data: payload },
      { onSuccess: () => setReviewDialog(null) }
    );
  };

  const daysBetween = (from, to) =>
    Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Avatar sx={{ bgcolor: "#fee2e2", color: "#dc2626", width: 44, height: 44 }}>
          <EventBusy />
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>
            Leave Requests
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Review and approve/reject teacher leave applications
          </Typography>
        </Box>
      </Stack>

      <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e2e8f0", borderRadius: 3 }}>
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          size="small"
          onChange={(e, val) => val && setStatusFilter(val)}
        >
          <ToggleButton value="PENDING" sx={{ textTransform: "none", px: 2 }}>Pending</ToggleButton>
          <ToggleButton value="APPROVED" sx={{ textTransform: "none", px: 2 }}>Approved</ToggleButton>
          <ToggleButton value="REJECTED" sx={{ textTransform: "none", px: 2 }}>Rejected</ToggleButton>
          <ToggleButton value="" sx={{ textTransform: "none", px: 2 }}>All</ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f8fafc" }}>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Teacher</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Dates</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Days</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Reason</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaves.map((l) => (
              <TableRow key={l._id} hover>
                <TableCell>{l.teacher?.name}</TableCell>
                <TableCell>
                  {new Date(l.fromDate).toLocaleDateString("en-IN")} - {new Date(l.toDate).toLocaleDateString("en-IN")}
                </TableCell>
                <TableCell>{daysBetween(l.fromDate, l.toDate)}</TableCell>
                <TableCell sx={{ maxWidth: 200 }}>{l.reason}</TableCell>
                <TableCell>
                  <Chip label={l.status} size="small" color={statusColor[l.status]} />
                  {l.leaveType && (
                    <Chip label={l.leaveType} size="small" variant="outlined" sx={{ ml: 0.5 }} />
                  )}
                </TableCell>
                <TableCell align="right">
                  {l.status === "PENDING" && (
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" color="success" variant="outlined" startIcon={<Check />} onClick={() => openReview(l, "APPROVED")}>
                        Approve
                      </Button>
                      <Button size="small" color="error" variant="outlined" startIcon={<Close />} onClick={() => openReview(l, "REJECTED")}>
                        Reject
                      </Button>
                    </Stack>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {leaves.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "#94a3b8" }}>No leave requests</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Review Dialog */}
      <Dialog open={!!reviewDialog} onClose={() => setReviewDialog(null)} PaperProps={{ sx: { borderRadius: 3, minWidth: 380 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {reviewDialog?.action === "APPROVED" ? "Approve Leave" : "Reject Leave"}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {reviewDialog?.action === "APPROVED" && (
            <Select size="small" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
              <MenuItem value="PAID">Paid Leave</MenuItem>
              <MenuItem value="UNPAID">Unpaid Leave</MenuItem>
            </Select>
          )}
          <TextField
            label="Note (optional)"
            size="small"
            multiline
            rows={2}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setReviewDialog(null)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitReview}
            disabled={isPending}
            color={reviewDialog?.action === "APPROVED" ? "success" : "error"}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
          >
            {isPending ? "Saving..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}