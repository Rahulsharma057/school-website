"use client";

import { useState } from "react";
import PortalGuard from "@/components/PortalGuard";
import {
  Box, Typography, Paper, TextField, Button, Table, TableHead,
  TableBody, TableRow, TableCell, Chip, Stack,
} from "@mui/material";
import { useApplyLeave, useMyLeaveRequests } from "@/hooks/useLeaveRequest";

const statusColor = { PENDING: "warning", APPROVED: "success", REJECTED: "error" };

function LeaveContent() {
  const { data: leaves = [] } = useMyLeaveRequests();
  const { mutate: applyLeave, isPending } = useApplyLeave();

  const [form, setForm] = useState({ fromDate: "", toDate: "", reason: "" });

  const handleSubmit = () => {
    if (!form.fromDate || !form.toDate || !form.reason) return;
    applyLeave(form, { onSuccess: () => setForm({ fromDate: "", toDate: "", reason: "" }) });
  };

  return (
    <>
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: "1px solid #e2e8f0", borderRadius: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Apply for Leave</Typography>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              type="date" label="From Date" size="small" InputLabelProps={{ shrink: true }}
              value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
            />
            <TextField
              type="date" label="To Date" size="small" InputLabelProps={{ shrink: true }}
              value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })}
            />
          </Stack>
          <TextField
            label="Reason" size="small" multiline rows={2}
            value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
          <Box>
            <Button variant="contained" onClick={handleSubmit} disabled={isPending} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}>
              {isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </Box>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f8fafc" }}>
              <TableCell>Dates</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Note</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaves.map((l) => (
              <TableRow key={l._id}>
                <TableCell>{new Date(l.fromDate).toLocaleDateString("en-IN")} - {new Date(l.toDate).toLocaleDateString("en-IN")}</TableCell>
                <TableCell>{l.reason}</TableCell>
                <TableCell>
                  <Chip label={l.status} size="small" color={statusColor[l.status]} />
                  {l.leaveType && <Chip label={l.leaveType} size="small" variant="outlined" sx={{ ml: 0.5 }} />}
                </TableCell>
                <TableCell>{l.reviewNote || "—"}</TableCell>
              </TableRow>
            ))}
            {leaves.length === 0 && (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: "#94a3b8" }}>No leave requests yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}

export default function MyLeavePage() {
  return (
    <PortalGuard allowedRoles={["TEACHER"]}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" mb={3}>My Leave Requests</Typography>
        <LeaveContent />
      </Box>
    </PortalGuard>
  );
}